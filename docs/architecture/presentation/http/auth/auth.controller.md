# AuthController

Fichier documente: `src/presentation/http/auth/auth.controller.ts`.

## Role

`AuthController` expose les routes HTTP d'authentification sous le prefixe:

```text
/auth
```

Il gere uniquement le transport HTTP:

- recevoir les DTOs de requete;
- declencher les commandes Application via `CommandBus`;
- presenter les tokens d'authentification;
- appliquer le filtre d'exceptions utilisateur.

Il ne contient pas la logique metier de login, de rotation de refresh token ou de logout. Cette logique vit dans les use cases Application appeles via les commandes CQRS.

## Dependances

Le controller depend de:

- `CommandBus`, pour declencher les use cases d'authentification;
- `LoginRequest`, `RefreshTokenRequest`, `LogoutRequest`, pour valider la forme HTTP entrante;
- `AuthTokensPresenter`, pour convertir le read model Application en reponse HTTP;
- `UserDomainExceptionFilter`, pour mapper les erreurs Domain/Application connues vers HTTP;
- `@Public()`, pour ouvrir explicitement certaines routes malgre les guards globaux.

Il n'injecte ni use case direct, ni repository, ni service JWT, ni Prisma.

## Securite par defaut

Les guards `JwtAuthGuard` et `RolesGuard` sont globaux. Une route est donc authentifiee par defaut.

Dans ce controller:

- `POST /auth/login` est public;
- `POST /auth/token/refresh` est public;
- `POST /auth/token/invalidate` est authentifie.

L'invalidation d'un refresh token demande un access token valide, car la route n'a pas `@Public()`.

## Filtre d'exceptions

Le controller applique:

```ts
@UseFilters(UserDomainExceptionFilter)
```

Ce filtre convertit les exceptions Domain/Application liees a l'utilisateur en reponses HTTP stables.

Le controller ne fait donc pas de `try/catch` autour des commandes. Il laisse les use cases lancer leurs exceptions et le filtre les convertir.

## Routes

### `POST /auth/login`

Decorateurs:

```ts
@Public()
@Post("login")
@HttpCode(200)
```

Cette route est publique pour permettre a un utilisateur non authentifie de se connecter.

Corps attendu:

```ts
{
  email: string;
  password: string;
}
```

Validation HTTP:

- `email` doit etre un email valide;
- `password` doit etre une chaine non vide.

Flux:

```text
HTTP LoginRequest
  -> LoginCommand(email, password)
  -> CommandBus
  -> LoginUseCase
  -> AuthTokensReadModel
  -> AuthTokensPresenter
  -> AuthTokensResponse
```

Reponse `200`:

```ts
{
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
```

### `POST /auth/token/refresh`

Decorateurs:

```ts
@Public()
@Post("token/refresh")
@HttpCode(200)
```

Cette route est publique car elle sert a obtenir une nouvelle paire de tokens a partir d'un refresh token. Elle ne demande pas d'access token valide.

Corps attendu:

```ts
{
  refreshToken: string;
}
```

Validation HTTP:

- `refreshToken` doit etre une chaine non vide.

Flux:

```text
HTTP RefreshTokenRequest
  -> RefreshTokenCommand(refreshToken)
  -> CommandBus
  -> RefreshTokenUseCase
  -> AuthTokensReadModel
  -> AuthTokensPresenter
  -> AuthTokensResponse
```

Reponse `200`:

```ts
{
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
```

Le refresh token est gere comme un token persiste a usage unique cote Application/Infrastructure. La rotation n'est pas implementee dans le controller.

### `POST /auth/token/invalidate`

Decorateurs:

```ts
@Post("token/invalidate")
@HttpCode(204)
```

Cette route n'est pas publique. Elle passe donc par `JwtAuthGuard` avant d'arriver au controller.

Corps attendu:

```ts
{
  refreshToken: string;
}
```

Validation HTTP:

- `refreshToken` doit etre une chaine non vide.

Flux:

```text
HTTP LogoutRequest
  -> JwtAuthGuard
  -> LogoutCommand(refreshToken)
  -> CommandBus
  -> LogoutUseCase
  -> 204 No Content
```

Reponse:

```text
204 No Content
```

Le controller ne retourne pas de corps.

## Presentation de la reponse tokens

`AuthTokensPresenter` est un presenter sans dependance. Il expose une methode statique:

```ts
AuthTokensPresenter.present(tokens)
```

Il copie les champs du `AuthTokensReadModel` vers la reponse HTTP:

```ts
{
  accessToken,
  refreshToken,
  tokenType,
  expiresIn,
}
```

La forme publique de la reponse est donc controlee par la Presentation, pas par le use case.

## Points d'attention

- Les routes publiques doivent porter explicitement `@Public()`.
- Le controller ne doit jamais injecter directement un use case d'authentification.
- Le controller ne manipule pas directement `JwtService`.
- La route d'invalidation est authentifiee car elle n'a pas `@Public()`.
- Les erreurs metier doivent continuer a remonter vers `UserDomainExceptionFilter`.
- Les DTOs valident la forme HTTP; les regles metier restent dans les use cases et le domaine.
