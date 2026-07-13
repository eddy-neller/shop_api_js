import type { Provider } from "@nestjs/common";
import { RegisterUserUseCase } from "@/application/onboarding/use-case/command/register-user/register-user.use-case";
import { RequestActivationEmailUseCase } from "@/application/onboarding/use-case/command/request-activation-email/request-activation-email.use-case";
import { ValidateActivationUseCase } from "@/application/onboarding/use-case/command/validate-activation/validate-activation.use-case";
import { CLOCK, type ClockPort } from "@/application/shared/port/clock.port";
import { CONFIG, type ConfigPort } from "@/application/shared/port/config.port";
import {
  PASSWORD_HASHER,
  type PasswordHasherPort,
} from "@/application/shared/port/password-hasher.port";
import {
  TOKEN_PROVIDER,
  type TokenProviderPort,
} from "@/application/shared/port/token-provider.port";
import {
  TRANSACTIONAL,
  type TransactionalPort,
} from "@/application/shared/port/transactional.port";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "@/application/shared/port/user-repository.port";
import {
  USER_UNIQUENESS_CHECKER,
  type UserUniquenessCheckerPort,
} from "@/application/shared/port/user-uniqueness-checker.port";
import { RegisterUserNestCommandHandler } from "@/infrastructure/nest/cqrs/onboarding/command/register-user.nest-command-handler";
import { RequestActivationEmailNestCommandHandler } from "@/infrastructure/nest/cqrs/onboarding/command/request-activation-email.nest-command-handler";
import { ValidateActivationNestCommandHandler } from "@/infrastructure/nest/cqrs/onboarding/command/validate-activation.nest-command-handler";

export const onboardingCqrsHandlers: Provider[] = [
  RegisterUserNestCommandHandler,
  RequestActivationEmailNestCommandHandler,
  ValidateActivationNestCommandHandler,
];

export const onboardingUseCaseProviders: Provider[] = [
  {
    provide: RegisterUserUseCase,
    useFactory: (
      users: UserRepositoryPort,
      uniquenessChecker: UserUniquenessCheckerPort,
      passwordHasher: PasswordHasherPort,
      tokenProvider: TokenProviderPort,
      clock: ClockPort,
      transactional: TransactionalPort,
      config: ConfigPort,
    ) =>
      new RegisterUserUseCase(
        users,
        uniquenessChecker,
        passwordHasher,
        tokenProvider,
        clock,
        transactional,
        config,
      ),
    inject: [
      USER_REPOSITORY,
      USER_UNIQUENESS_CHECKER,
      PASSWORD_HASHER,
      TOKEN_PROVIDER,
      CLOCK,
      TRANSACTIONAL,
      CONFIG,
    ],
  },
  {
    provide: RequestActivationEmailUseCase,
    useFactory: (
      users: UserRepositoryPort,
      tokenProvider: TokenProviderPort,
      clock: ClockPort,
      transactional: TransactionalPort,
      config: ConfigPort,
    ) =>
      new RequestActivationEmailUseCase(
        users,
        tokenProvider,
        clock,
        transactional,
        config,
      ),
    inject: [USER_REPOSITORY, TOKEN_PROVIDER, CLOCK, TRANSACTIONAL, CONFIG],
  },
  {
    provide: ValidateActivationUseCase,
    useFactory: (
      users: UserRepositoryPort,
      tokenProvider: TokenProviderPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) =>
      new ValidateActivationUseCase(users, tokenProvider, clock, transactional),
    inject: [USER_REPOSITORY, TOKEN_PROVIDER, CLOCK, TRANSACTIONAL],
  },
];
