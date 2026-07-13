# AppModule

Fichier documente: `src/infrastructure/nest/app.module.ts`.

`AppModule` est le module Nest racine. Il ne declare pas directement de controllers, handlers CQRS, use cases ou adapters.

Son role est uniquement de composer `CoreModule` et les modules de capacite:

```ts
imports: [
  CoreModule,
  AuthModule,
  OnboardingModule,
  AccountModule,
  UserManagementModule,
];
```

## Modules

- `CoreModule`: modules Nest techniques et providers partages.
- `AuthModule`: routes et use cases d'authentification.
- `OnboardingModule`: inscription et activation de compte.
- `AccountModule`: compte courant, reset password, avatar et securite de compte.
- `UserManagementModule`: administration des utilisateurs.

## Ordre

`AccountModule` doit etre importe avant `UserManagementModule`, car `MeController` expose `GET /users/me` et `UserManagementController` expose `GET /users/:id`.

Cet ordre evite que la route statique `/users/me` soit capturee par la route parametree `/users/:id`.

## Regle de composition

Les modules de capacite ne s'importent pas entre eux et n'exportent rien. Un provider consomme par plusieurs capacites doit remonter dans `CoreModule`.
