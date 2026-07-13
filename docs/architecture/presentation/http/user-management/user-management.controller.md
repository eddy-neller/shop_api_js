# UserManagementController

Fichier documente: `src/presentation/http/user-management/user-management.controller.ts`.

`UserManagementController` expose les routes admin sous le prefixe `/users`.

Routes:

- `GET /users`;
- `GET /users/:id`;
- `POST /users`;
- `PATCH /users/:id`;
- `DELETE /users/:id`.

Le controller porte `@Roles(UserRole.Admin)`.

Il utilise:

- `CommandBus` pour les commandes admin;
- `QueryBus` pour la liste et l'affichage;
- `UserPresenter`;
- `UserListPresenter`.

La route `GET /users/:id` reutilise `DisplayUserQuery`, dont le handler est cable par `AccountModule` dans la composition racine `AppModule`.
