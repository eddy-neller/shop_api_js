# OnboardingController

Fichier documente: `src/presentation/http/onboarding/onboarding.controller.ts`.

`OnboardingController` expose les routes publiques d'inscription sous le prefixe `/users`.

Routes:

- `POST /users/register`;
- `POST /users/register/email-activation-request`;
- `POST /users/register/validation`.

Le controller utilise uniquement `CommandBus` et presente `RegisterUserUseCase` via `UserPresenter`.
