# AccountModule

Fichiers documentes:

- `src/infrastructure/nest/modules/account/account.module.ts`;
- `src/infrastructure/nest/modules/account/account.providers.ts`.

`AccountModule` expose:

- `MeController` pour `/users/me`;
- `AccountRecoveryController` pour `/users/reset-password/*`.

Handlers CQRS:

- `RequestPasswordResetNestCommandHandler`;
- `ConfirmPasswordResetNestCommandHandler`;
- `RegisterWrongPasswordAttemptNestCommandHandler`;
- `ResetWrongPasswordAttemptsNestCommandHandler`;
- `UpdatePasswordNestCommandHandler`;
- `UpdateAvatarNestCommandHandler`;
- `DisplayUserNestQueryHandler`;
- `CheckPasswordResetTokenNestQueryHandler`.

Use cases:

- `RequestPasswordResetUseCase`;
- `ConfirmPasswordResetUseCase`;
- `RegisterWrongPasswordAttemptUseCase`;
- `ResetWrongPasswordAttemptsUseCase`;
- `UpdatePasswordUseCase`;
- `UpdateAvatarUseCase`;
- `DisplayUserUseCase`;
- `CheckPasswordResetTokenUseCase`.

Ports specifiques:

- `AVATAR_UPLOADER -> DiskAvatarUploader`;
- `AVATAR_IMAGE_VALIDATOR -> SharpAvatarImageValidator`.

`AVATAR_URL_RESOLVER -> PathAvatarUrlResolver` est cable dans `CoreModule`, car il est consomme par des presenters declares dans plusieurs modules de capacite.

Le module n'exporte rien et n'importe aucun autre module de capacite.
