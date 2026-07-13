# AccountRecoveryController

Fichier documente: `src/presentation/http/account/account-recovery.controller.ts`.

`AccountRecoveryController` expose les routes publiques de reset password sous le prefixe `/users`.

Routes:

- `POST /users/reset-password/request`;
- `POST /users/reset-password/check`;
- `POST /users/reset-password/confirm`.

Le controller utilise `CommandBus` pour les mutations et `QueryBus` pour la verification de token.
