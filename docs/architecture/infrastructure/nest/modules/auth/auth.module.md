# AuthModule

Fichiers documentes:

- `src/infrastructure/nest/modules/auth/auth.module.ts`;
- `src/infrastructure/nest/modules/auth/auth.providers.ts`.

`AuthModule` expose `AuthController` et cable les cas d'usage d'authentification.

Handlers CQRS:

- `LoginNestCommandHandler`;
- `RefreshTokenNestCommandHandler`;
- `LogoutNestCommandHandler`.

Use cases:

- `LoginUseCase`;
- `RefreshTokenUseCase`;
- `LogoutUseCase`.

Ports specifiques:

- `REFRESH_TOKEN_REPOSITORY -> PrismaRefreshTokenRepository`.
- `REFRESH_TOKEN_HASHER -> Sha256RefreshTokenHasher`.

`ACCESS_TOKEN_PROVIDER -> JwtAccessTokenProvider` est cable dans `CoreModule`, car il est consomme par les use cases d'authentification et par le guard global `JwtAuthGuard`.

Les ports partages (`ACCESS_TOKEN_PROVIDER`, `USER_REPOSITORY`, `PASSWORD_HASHER`, `TOKEN_PROVIDER`, `CLOCK`, `CONFIG`, `TRANSACTIONAL`) viennent de `CoreModule`.

Le module n'exporte rien et n'importe aucun autre module de capacite.
