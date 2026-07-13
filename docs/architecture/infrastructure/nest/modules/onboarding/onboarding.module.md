# OnboardingModule

Fichiers documentes:

- `src/infrastructure/nest/modules/onboarding/onboarding.module.ts`;
- `src/infrastructure/nest/modules/onboarding/onboarding.providers.ts`.

`OnboardingModule` expose `OnboardingController` et cable l'inscription ainsi que l'activation de compte.

Handlers CQRS:

- `RegisterUserNestCommandHandler`;
- `RequestActivationEmailNestCommandHandler`;
- `ValidateActivationNestCommandHandler`.

Use cases:

- `RegisterUserUseCase`;
- `RequestActivationEmailUseCase`;
- `ValidateActivationUseCase`.

Le module declare `UserPresenter`, car `POST /users/register` retourne une representation utilisateur.

Les ports partages viennent de `CoreModule`.

Le module n'exporte rien et n'importe aucun autre module de capacite.
