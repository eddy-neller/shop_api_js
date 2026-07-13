# MeController

Fichier documente: `src/presentation/http/account/me.controller.ts`.

## Role

`MeController` expose les routes HTTP du compte courant sous le prefixe:

```text
/users/me
```

Il sert aux actions que l'utilisateur authentifie effectue sur son propre compte:

- consulter son profil;
- changer son mot de passe;
- mettre a jour son avatar.

La regle principale de ce controller est que l'identifiant cible vient toujours du JWT, via `@CurrentUser()`. Il ne vient jamais d'un parametre d'URL.

## Dependances

Le controller depend de:

- `CommandBus`, pour declencher les mutations Application;
- `QueryBus`, pour declencher les lectures Application;
- `UserPresenter`, pour convertir `UserReadModel` en `UserResponse`;
- `CurrentUser`, pour recuperer l'utilisateur authentifie depuis `request.user`;
- `UserDomainExceptionFilter`, pour convertir les exceptions Domain/Application connues;
- `FileInterceptor` et `ParseFilePipe`, pour recevoir et valider l'upload d'avatar au bord HTTP.

Il n'injecte ni use case direct, ni repository, ni Prisma, ni service de stockage.

## Securite

Le controller ne porte pas `@Public()`.

Toutes ses routes sont donc protegees par les guards globaux:

```text
JwtAuthGuard
  -> RolesGuard
  -> MeController
```

`JwtAuthGuard` verifie le JWT et pose `request.user`. `@CurrentUser()` lit ensuite ce principal HTTP.

## Filtre d'exceptions

Le controller applique:

```ts
@UseFilters(UserDomainExceptionFilter)
```

Les erreurs metier utilisateur sont donc mappees par le filtre, sans `try/catch` dans le controller.

## Routes

### `GET /users/me`

Cette route retourne le profil de l'utilisateur authentifie.

Flux:

```text
Requete authentifiee
  -> JwtAuthGuard
  -> @CurrentUser()
  -> DisplayUserQuery(current.id)
  -> QueryBus
  -> DisplayUserUseCase
  -> UserReadModel
  -> UserPresenter
  -> UserResponse
```

Point important:

```ts
new DisplayUserQuery(current.id)
```

L'id utilise est celui du token. Aucun `:id` n'est accepte dans l'URL.

Reponse:

```ts
{
  id: string;
  email: string;
  roles: string[];
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### `PATCH /users/me/password`

Decorateurs:

```ts
@Patch("password")
@HttpCode(204)
```

Cette route change le mot de passe de l'utilisateur authentifie.

Corps attendu:

```ts
{
  currentPassword: string;
  newPassword: string;
}
```

Validation HTTP:

- `currentPassword` doit etre une chaine non vide;
- `newPassword` doit respecter le validateur Presentation `@IsPassword()`.

Flux:

```text
Requete authentifiee
  -> @CurrentUser()
  -> UpdatePasswordRequest
  -> UpdatePasswordCommand(current.id, currentPassword, newPassword)
  -> CommandBus
  -> UpdatePasswordUseCase
  -> 204 No Content
```

Reponse:

```text
204 No Content
```

Le controller ne retourne pas le nouvel etat utilisateur.

### `POST /users/me/avatar`

Decorateurs:

```ts
@Post("avatar")
@UseInterceptors(FileInterceptor("avatarFile"))
```

Cette route met a jour l'avatar de l'utilisateur authentifie.

Champ multipart attendu:

```text
avatarFile
```

Validation HTTP au bord Presentation:

- taille brute maximale: `3 * 1024 * 1024` octets;
- type MIME accepte: `image/jpeg`, `image/png`, `image/webp`.

Cette limite HTTP est une borne de securite pour l'upload en memoire. Elle est distincte de la limite metier/infra configuree par `AVATAR_MAX_SIZE`.

Flux:

```text
Requete authentifiee multipart/form-data
  -> FileInterceptor("avatarFile")
  -> ParseFilePipe
    -> MaxFileSizeValidator
    -> FileTypeValidator
  -> UpdateAvatarCommand(current.id, AvatarFile)
  -> CommandBus
  -> UpdateAvatarUseCase
  -> UserReadModel
  -> UserPresenter
  -> UserResponse
```

Le controller transforme `Express.Multer.File` en objet attendu par l'Application:

```ts
{
  buffer: file.buffer,
  mimeType: file.mimetype,
  size: file.size,
  originalName: file.originalname,
}
```

Reponse:

```ts
{
  id: string;
  email: string;
  roles: string[];
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Presentation utilisateur

`UserPresenter` convertit `UserReadModel` en `UserResponse`.

Il resout notamment l'URL publique de l'avatar:

```text
avatarName -> avatarUrl
```

Cette derivation est propre au transport HTTP. Elle reste donc dans le presenter, pas dans le use case.

## Points d'attention

- Ne jamais ajouter de parametre `:id` dans les routes `/users/me/*`.
- L'id cible doit toujours venir de `@CurrentUser()`.
- Le controller doit continuer a passer par `CommandBus` et `QueryBus`.
- L'upload HTTP valide seulement la forme et une borne de securite; la validation image complete reste hors du controller.
- `FileInterceptor("avatarFile")` impose le nom de champ multipart attendu par l'API.
- Le controller ne doit pas manipuler directement le disque, Prisma, un repository ou un use case.
