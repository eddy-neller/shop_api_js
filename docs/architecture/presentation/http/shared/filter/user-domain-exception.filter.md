# UserDomainExceptionFilter

Fichier documente: `src/presentation/http/shared/filter/user-domain-exception.filter.ts`.

## Role

`UserDomainExceptionFilter` convertit les exceptions Domain/Application liees au contexte utilisateur en reponses HTTP stables.

Il est utilise par les controllers utilisateur et auth via:

```ts
@UseFilters(UserDomainExceptionFilter)
```

Controllers concernes:

- `AuthController`;
- `MeController`;
- `OnboardingController`;
- `AccountRecoveryController`;
- `UserManagementController`.

Le filtre evite de mettre des `try/catch` dans les controllers. Les use cases peuvent lancer des exceptions metier, puis la Presentation les convertit en codes HTTP adaptes.

## Responsabilites

Le filtre fait trois choses:

- intercepter les exceptions utilisateur connues;
- choisir l'exception HTTP Nest correspondante;
- ecrire une reponse JSON stable.

Il ne decide pas de la regle metier. Il ne fait que traduire une erreur Domain/Application vers le transport HTTP.

## Exceptions interceptees

Le decorateur du filtre est:

```ts
@Catch(UserDomainException, InvalidUuidException)
```

Le filtre intercepte donc:

- les exceptions qui heritent de `UserDomainException`;
- `InvalidUuidException`, exception partagee utilisee notamment pour les ids invalides.

## Reponse HTTP standard

Le filtre delegue l'ecriture de la reponse a:

```ts
writeHttpExceptionResponse(response, httpException);
```

La forme JSON produite est:

```ts
{
  statusCode: number;
  error: string;
  message: string;
}
```

Exemple:

```json
{
  "statusCode": 409,
  "error": "ConflictException",
  "message": "Email address is already used."
}
```

`error` correspond au nom de l'exception HTTP Nest, ou au nom force pour les exceptions custom locales.

## Fonctionnement pas a pas

### 1. Une exception Domain/Application remonte

Un use case ou le domaine lance une exception, par exemple:

```ts
throw new EmailAlreadyUsedException();
```

Le controller ne la capture pas.

### 2. Nest appelle le filtre

Comme le controller porte `@UseFilters(UserDomainExceptionFilter)`, Nest appelle:

```ts
catch(exception: DomainException, host: ArgumentsHost): void
```

### 3. Le filtre recupere la reponse HTTP

Le filtre bascule le contexte Nest vers HTTP:

```ts
const response = host.switchToHttp().getResponse<Response>();
```

### 4. Le filtre convertit l'exception domaine en exception HTTP

Le filtre appelle:

```ts
const httpException = toUserHttpException(exception);
```

`toUserHttpException` cherche un mapping dans `USER_EXCEPTION_MAPPINGS` avec:

```ts
exception instanceof candidate.exception;
```

Le premier mapping correspondant est utilise.

### 5. Le filtre ecrit la reponse

Le filtre appelle:

```ts
writeHttpExceptionResponse(response, httpException);
```

Cette fonction:

1. lit le status HTTP avec `httpException.getStatus()`;
2. appelle `response.status(status)`;
3. ecrit le JSON `{ statusCode, error, message }`.

## Mapping des exceptions

### `409 Conflict`

Ces erreurs indiquent un conflit d'unicite ou d'etat avec une ressource existante:

| Exception domaine              | Exception HTTP      |
| ------------------------------ | ------------------- |
| `EmailAlreadyUsedException`    | `ConflictException` |
| `UsernameAlreadyUsedException` | `ConflictException` |

### `404 Not Found`

| Exception domaine       | Exception HTTP      |
| ----------------------- | ------------------- |
| `UserNotFoundException` | `NotFoundException` |

### `429 Too Many Requests`

Nest ne fournit pas ici d'exception dediee utilisee directement dans le fichier. Le filtre declare donc une classe locale:

```ts
class TooManyRequestsHttpException extends HttpException
```

Elle utilise le status:

```ts
HttpStatus.TOO_MANY_REQUESTS;
```

Mappings:

| Exception domaine                    | Exception HTTP             |
| ------------------------------------ | -------------------------- |
| `ActivationLimitReachedException`    | `TooManyRequestsException` |
| `ResetPasswordLimitReachedException` | `TooManyRequestsException` |

### `423 Locked`

Le filtre declare une classe locale:

```ts
class LockedException extends HttpException
```

Elle utilise le status:

```ts
HttpStatus.LOCKED;
```

Mapping:

| Exception domaine     | Exception HTTP    |
| --------------------- | ----------------- |
| `UserLockedException` | `LockedException` |

### `401 Unauthorized`

Ces erreurs representent un echec d'authentification ou de token:

| Exception domaine              | Exception HTTP          |
| ------------------------------ | ----------------------- |
| `InvalidCredentialsException`  | `UnauthorizedException` |
| `InvalidRefreshTokenException` | `UnauthorizedException` |

### `403 Forbidden`

| Exception domaine              | Exception HTTP       |
| ------------------------------ | -------------------- |
| `AccountNotActivatedException` | `ForbiddenException` |

### `422 Unprocessable Entity`

Ces erreurs indiquent une donnee syntaxiquement recue par HTTP mais invalide pour le domaine:

| Exception domaine                 | Exception HTTP                 |
| --------------------------------- | ------------------------------ |
| `InvalidEmailException`           | `UnprocessableEntityException` |
| `InvalidFirstnameException`       | `UnprocessableEntityException` |
| `InvalidLastnameException`        | `UnprocessableEntityException` |
| `InvalidAvatarException`          | `UnprocessableEntityException` |
| `InvalidPreferencesException`     | `UnprocessableEntityException` |
| `InvalidUserStatusException`      | `UnprocessableEntityException` |
| `InvalidRoleException`            | `UnprocessableEntityException` |
| `InvalidCurrentPasswordException` | `UnprocessableEntityException` |
| `SamePasswordException`           | `UnprocessableEntityException` |
| `InvalidUuidException`            | `UnprocessableEntityException` |

### `400 Bad Request`

Si aucune entree de `USER_EXCEPTION_MAPPINGS` ne correspond, la fonction retourne:

```ts
new BadRequestException(exception.message);
```

C'est le fallback.

Exemples actuels couverts par les tests:

- `InvalidPasswordHashException`;
- `UserDomainException` generique;
- une `DomainException` inconnue.

## Pourquoi `InvalidUuidException` est ici

`InvalidUuidException` vit dans `domain/shared`, pas dans `domain/user`.

Elle est tout de meme mappee par ce filtre parce que les endpoints utilisateur manipulent des ids utilisateur au format UUID. Quand une validation d'id remonte sous forme d'exception domaine partagee, la Presentation utilisateur la traduit en `422 Unprocessable Entity`.

Sa presence dans `@Catch(UserDomainException, InvalidUuidException)` est distincte de sa presence dans `USER_EXCEPTION_MAPPINGS`:

- `@Catch(...)` indique a Nest quelles classes d'exceptions ce filtre intercepte;
- `USER_EXCEPTION_MAPPINGS` indique seulement comment convertir une exception deja interceptee en exception HTTP.

Comme `InvalidUuidException` herite de `DomainException` et non de `UserDomainException`, elle ne serait pas interceptee par ce filtre avec un simple `@Catch(UserDomainException)`, meme si elle restait presente dans `USER_EXCEPTION_MAPPINGS`.

## Classes HTTP locales

Le fichier declare deux petites exceptions HTTP locales:

```ts
class LockedException extends HttpException
class TooManyRequestsHttpException extends HttpException
```

Elles servent a produire des statuts HTTP precis:

- `423 Locked`;
- `429 Too Many Requests`.

Elles fixent aussi le `name`, afin que le champ `error` de la reponse reste stable:

```ts
this.name = "LockedException";
this.name = "TooManyRequestsException";
```

## Ajouter une nouvelle exception utilisateur

Quand une nouvelle exception Domain/Application peut sortir d'une route utilisateur ou auth:

1. verifier qu'elle herite de `UserDomainException`, ou qu'elle est explicitement capturee par le filtre;
2. ajouter une entree dans `USER_EXCEPTION_MAPPINGS` si le fallback `400 Bad Request` n'est pas le bon status;
3. ajouter ou mettre a jour un test dans `test/presentation/http/user-domain-exception.filter.spec.ts`;
4. garder le message de l'exception en anglais, conformement aux regles du depot.

Exemple de mapping:

```ts
{
  exception: SomeUserException,
  toHttpException: (message) => new UnprocessableEntityException(message),
}
```

## Points d'attention

- Le filtre est une traduction Presentation, pas une source de logique metier.
- L'ordre des mappings peut compter si une exception herite d'une autre exception deja mappee.
- Le fallback `400 Bad Request` est volontairement generique pour les exceptions domaine non mappees.
- La forme JSON d'erreur doit rester stable: `statusCode`, `error`, `message`.
- Les controllers ne doivent pas dupliquer ces mappings avec des `try/catch`.
- Toute exception utilisateur nouvelle exposee en HTTP doit etre pensee avec son status et son test de mapping.
