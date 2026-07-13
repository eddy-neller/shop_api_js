# UserManagementModule

Fichiers documentes:

- `src/infrastructure/nest/modules/user-management/user-management.module.ts`;
- `src/infrastructure/nest/modules/user-management/user-management.providers.ts`.

`UserManagementModule` expose `UserManagementController` et cable les routes admin `/users`.

Handlers CQRS:

- `CreateUserByAdminNestCommandHandler`;
- `UpdateUserByAdminNestCommandHandler`;
- `DeleteUserByAdminNestCommandHandler`;
- `ListUsersNestQueryHandler`.

Use cases:

- `CreateUserByAdminUseCase`;
- `UpdateUserByAdminUseCase`;
- `DeleteUserByAdminUseCase`;
- `ListUsersUseCase`.

Il declare:

- `UserPresenter`;
- `UserListPresenter`.

La route `GET /users/:id` reutilise `DisplayUserQuery`; son handler est declare par `AccountModule`, compose a cote de ce module dans `AppModule`.

Le module n'exporte rien et n'importe aucun autre module de capacite.
