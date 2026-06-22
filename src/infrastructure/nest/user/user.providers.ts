import type { Provider } from "@nestjs/common";
import {
  CLOCK,
  type ClockPort,
} from "@/application/shared/port/clock.port";
import {
  CONFIG,
  type ConfigPort,
} from "@/application/shared/port/config.port";
import {
  TRANSACTIONAL,
  type TransactionalPort,
} from "@/application/shared/port/transactional.port";
import { ConfirmPasswordResetUseCase } from "@/application/user/use-case/command/confirm-password-reset/confirm-password-reset.use-case";
import { RegisterWrongPasswordAttemptUseCase } from "@/application/user/use-case/command/register-wrong-password-attempt/register-wrong-password-attempt.use-case";
import { RegisterUserUseCase } from "@/application/user/use-case/command/register/register.use-case";
import { RequestActivationEmailUseCase } from "@/application/user/use-case/command/request-activation-email/request-activation-email.use-case";
import { RequestPasswordResetUseCase } from "@/application/user/use-case/command/request-password-reset/request-password-reset.use-case";
import { ResetWrongPasswordAttemptsUseCase } from "@/application/user/use-case/command/reset-wrong-password-attempts/reset-wrong-password-attempts.use-case";
import { ValidateActivationUseCase } from "@/application/user/use-case/command/validate-activation/validate-activation.use-case";
import {
  ID_GENERATOR,
  type IdGeneratorPort,
} from "@/application/user/port/id-generator.port";
import {
  PASSWORD_HASHER,
  type PasswordHasherPort,
} from "@/application/user/port/password-hasher.port";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "@/application/user/port/user-repository.port";
import {
  USER_UNIQUENESS_CHECKER,
  type UserUniquenessCheckerPort,
} from "@/application/user/port/user-uniqueness-checker.port";
import {
  TOKEN_PROVIDER,
  type TokenProviderPort,
} from "@/application/user/port/token-provider.port";
import { UserUniquenessChecker } from "@/application/user/service/user-uniqueness-checker";
import { ConfirmPasswordResetNestCommandHandler } from "@/infrastructure/nest/cqrs/user/confirm-password-reset.nest-command-handler";
import { GetUserByIdUseCase } from "@/application/user/use-case/query/get-by-id/get-by-id.use-case";
import { GetUserByIdNestQueryHandler } from "@/infrastructure/nest/cqrs/user/get-user-by-id.nest-query-handler";
import { RegisterWrongPasswordAttemptNestCommandHandler } from "@/infrastructure/nest/cqrs/user/register-wrong-password-attempt.nest-command-handler";
import { RegisterUserNestCommandHandler } from "@/infrastructure/nest/cqrs/user/register-user.nest-command-handler";
import { RequestActivationEmailNestCommandHandler } from "@/infrastructure/nest/cqrs/user/request-activation-email.nest-command-handler";
import { RequestPasswordResetNestCommandHandler } from "@/infrastructure/nest/cqrs/user/request-password-reset.nest-command-handler";
import { ResetWrongPasswordAttemptsNestCommandHandler } from "@/infrastructure/nest/cqrs/user/reset-wrong-password-attempts.nest-command-handler";
import { ValidateActivationNestCommandHandler } from "@/infrastructure/nest/cqrs/user/validate-activation.nest-command-handler";
import { PrismaUserRepository } from "@/infrastructure/persistence/user/prisma-user.repository";
import { BcryptPasswordHasher } from "@/infrastructure/service/crypto/bcrypt-password-hasher";
import { EnvConfig } from "@/infrastructure/service/config/env-config";
import { UuidGenerator } from "@/infrastructure/service/id/uuid-generator";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";
import { PrismaTransactional } from "@/infrastructure/persistence/prisma/transaction/prisma-transactional";
import { Base64TokenProvider } from "@/infrastructure/service/token/base64-token-provider";
import { SystemClock } from "@/infrastructure/service/time/system-clock";

export const userCqrsHandlers: Provider[] = [
  RegisterUserNestCommandHandler,
  RequestActivationEmailNestCommandHandler,
  ValidateActivationNestCommandHandler,
  RequestPasswordResetNestCommandHandler,
  ConfirmPasswordResetNestCommandHandler,
  RegisterWrongPasswordAttemptNestCommandHandler,
  ResetWrongPasswordAttemptsNestCommandHandler,
  GetUserByIdNestQueryHandler,
];

export const userUseCaseProviders: Provider[] = [
  {
    provide: RegisterUserUseCase,
    useFactory: (
      users: UserRepositoryPort,
      uniquenessChecker: UserUniquenessCheckerPort,
      passwordHasher: PasswordHasherPort,
      idGenerator: IdGeneratorPort,
      tokenProvider: TokenProviderPort,
      clock: ClockPort,
      transactional: TransactionalPort,
      config: ConfigPort,
    ) =>
      new RegisterUserUseCase(
        users,
        uniquenessChecker,
        passwordHasher,
        idGenerator,
        tokenProvider,
        clock,
        transactional,
        config,
      ),
    inject: [
      USER_REPOSITORY,
      USER_UNIQUENESS_CHECKER,
      PASSWORD_HASHER,
      ID_GENERATOR,
      TOKEN_PROVIDER,
      CLOCK,
      TRANSACTIONAL,
      CONFIG,
    ],
  },
  {
    provide: USER_UNIQUENESS_CHECKER,
    useFactory: (users: UserRepositoryPort) => new UserUniquenessChecker(users),
    inject: [USER_REPOSITORY],
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
      new ValidateActivationUseCase(
        users,
        tokenProvider,
        clock,
        transactional,
      ),
    inject: [USER_REPOSITORY, TOKEN_PROVIDER, CLOCK, TRANSACTIONAL],
  },
  {
    provide: RequestPasswordResetUseCase,
    useFactory: (
      users: UserRepositoryPort,
      tokenProvider: TokenProviderPort,
      clock: ClockPort,
      transactional: TransactionalPort,
      config: ConfigPort,
    ) =>
      new RequestPasswordResetUseCase(
        users,
        tokenProvider,
        clock,
        transactional,
        config,
      ),
    inject: [USER_REPOSITORY, TOKEN_PROVIDER, CLOCK, TRANSACTIONAL, CONFIG],
  },
  {
    provide: ConfirmPasswordResetUseCase,
    useFactory: (
      users: UserRepositoryPort,
      tokenProvider: TokenProviderPort,
      passwordHasher: PasswordHasherPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) =>
      new ConfirmPasswordResetUseCase(
        users,
        tokenProvider,
        passwordHasher,
        clock,
        transactional,
      ),
    inject: [
      USER_REPOSITORY,
      TOKEN_PROVIDER,
      PASSWORD_HASHER,
      CLOCK,
      TRANSACTIONAL,
    ],
  },
  {
    provide: RegisterWrongPasswordAttemptUseCase,
    useFactory: (
      users: UserRepositoryPort,
      clock: ClockPort,
      config: ConfigPort,
      transactional: TransactionalPort,
    ) =>
      new RegisterWrongPasswordAttemptUseCase(
        users,
        clock,
        config,
        transactional,
      ),
    inject: [USER_REPOSITORY, CLOCK, CONFIG, TRANSACTIONAL],
  },
  {
    provide: ResetWrongPasswordAttemptsUseCase,
    useFactory: (
      users: UserRepositoryPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) => new ResetWrongPasswordAttemptsUseCase(users, clock, transactional),
    inject: [USER_REPOSITORY, CLOCK, TRANSACTIONAL],
  },
  {
    provide: GetUserByIdUseCase,
    useFactory: (users: UserRepositoryPort) => new GetUserByIdUseCase(users),
    inject: [USER_REPOSITORY],
  },
];

export const userPortProviders: Provider[] = [
  PrismaTransactionContext,
  {
    provide: USER_REPOSITORY,
    useClass: PrismaUserRepository,
  },
  {
    provide: PASSWORD_HASHER,
    useClass: BcryptPasswordHasher,
  },
  {
    provide: ID_GENERATOR,
    useClass: UuidGenerator,
  },
  {
    provide: TOKEN_PROVIDER,
    useClass: Base64TokenProvider,
  },
  {
    provide: CLOCK,
    useClass: SystemClock,
  },
  {
    provide: TRANSACTIONAL,
    useClass: PrismaTransactional,
  },
  {
    provide: CONFIG,
    useClass: EnvConfig,
  },
];
