import type { Provider } from "@nestjs/common";
import { CLOCK, type ClockPort } from "@/application/shared/port/clock.port";
import { CONFIG, type ConfigPort } from "@/application/shared/port/config.port";
import {
  TRANSACTIONAL,
  type TransactionalPort,
} from "@/application/shared/port/transactional.port";
import { ConfirmPasswordResetUseCase } from "@/application/user/use-case/command/confirm-password-reset/confirm-password-reset.use-case";
import { RegisterWrongPasswordAttemptUseCase } from "@/application/user/use-case/command/register-wrong-password-attempt/register-wrong-password-attempt.use-case";
import { RegisterUserUseCase } from "@/application/user/use-case/command/register-user/register-user.use-case";
import { RequestActivationEmailUseCase } from "@/application/user/use-case/command/request-activation-email/request-activation-email.use-case";
import { RequestPasswordResetUseCase } from "@/application/user/use-case/command/request-password-reset/request-password-reset.use-case";
import { ResetWrongPasswordAttemptsUseCase } from "@/application/user/use-case/command/reset-wrong-password-attempts/reset-wrong-password-attempts.use-case";
import { ValidateActivationUseCase } from "@/application/user/use-case/command/validate-activation/validate-activation.use-case";
import {
  AVATAR_IMAGE_VALIDATOR,
  type AvatarImageValidatorPort,
} from "@/application/user/port/avatar-image-validator.port";
import {
  AVATAR_UPLOADER,
  type AvatarUploaderPort,
} from "@/application/user/port/avatar-uploader.port";
import { AVATAR_URL_RESOLVER } from "@/application/user/port/avatar-url-resolver.port";
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
import { ConfirmPasswordResetNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/confirm-password-reset.nest-command-handler";
import { DisplayUserUseCase } from "@/application/user/use-case/query/display-user/display-user.use-case";
import { DisplayUserNestQueryHandler } from "@/infrastructure/nest/cqrs/user/query/display-user.nest-query-handler";
import { ListUsersUseCase } from "@/application/user/use-case/query/list-users/list-users.use-case";
import { ListUsersNestQueryHandler } from "@/infrastructure/nest/cqrs/user/query/list-users.nest-query-handler";
import { RegisterWrongPasswordAttemptNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/register-wrong-password-attempt.nest-command-handler";
import { RegisterUserNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/register-user.nest-command-handler";
import { RequestActivationEmailNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/request-activation-email.nest-command-handler";
import { RequestPasswordResetNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/request-password-reset.nest-command-handler";
import { ResetWrongPasswordAttemptsNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/reset-wrong-password-attempts.nest-command-handler";
import { ValidateActivationNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/validate-activation.nest-command-handler";
import { CreateUserByAdminUseCase } from "@/application/user/use-case/command/create-user-by-admin/create-user-by-admin.use-case";
import { DeleteUserByAdminUseCase } from "@/application/user/use-case/command/delete-user-by-admin/delete-user-by-admin.use-case";
import { UpdateAvatarUseCase } from "@/application/user/use-case/command/update-avatar/update-avatar.use-case";
import { UpdatePasswordUseCase } from "@/application/user/use-case/command/update-password/update-password.use-case";
import { UpdateUserByAdminUseCase } from "@/application/user/use-case/command/update-user-by-admin/update-user-by-admin.use-case";
import { CheckPasswordResetTokenUseCase } from "@/application/user/use-case/query/check-password-reset-token/check-password-reset-token.use-case";
import { CreateUserByAdminNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/create-user-by-admin.nest-command-handler";
import { DeleteUserByAdminNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/delete-user-by-admin.nest-command-handler";
import { UpdateAvatarNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/update-avatar.nest-command-handler";
import { UpdatePasswordNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/update-password.nest-command-handler";
import { UpdateUserByAdminNestCommandHandler } from "@/infrastructure/nest/cqrs/user/command/update-user-by-admin.nest-command-handler";
import { CheckPasswordResetTokenNestQueryHandler } from "@/infrastructure/nest/cqrs/user/query/check-password-reset-token.nest-query-handler";
import { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import { PrismaUserRepository } from "@/infrastructure/persistence/user/prisma-user.repository";
import { BcryptPasswordHasher } from "@/infrastructure/service/crypto/bcrypt-password-hasher";
import { EnvConfig } from "@/infrastructure/service/config/env-config";
import { UuidGenerator } from "@/infrastructure/service/id/uuid-generator";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";
import { PrismaTransactional } from "@/infrastructure/persistence/prisma/transaction/prisma-transactional";
import { Base64TokenProvider } from "@/infrastructure/service/token/base64-token-provider";
import { SystemClock } from "@/infrastructure/service/time/system-clock";
import { DiskAvatarUploader } from "@/infrastructure/service/storage/disk-avatar-uploader";
import { PathAvatarUrlResolver } from "@/infrastructure/service/storage/path-avatar-url-resolver";
import { SharpAvatarImageValidator } from "@/infrastructure/service/storage/sharp-avatar-image-validator";

export const userCqrsHandlers: Provider[] = [
  RegisterUserNestCommandHandler,
  RequestActivationEmailNestCommandHandler,
  ValidateActivationNestCommandHandler,
  RequestPasswordResetNestCommandHandler,
  ConfirmPasswordResetNestCommandHandler,
  RegisterWrongPasswordAttemptNestCommandHandler,
  ResetWrongPasswordAttemptsNestCommandHandler,
  CreateUserByAdminNestCommandHandler,
  UpdateUserByAdminNestCommandHandler,
  UpdatePasswordNestCommandHandler,
  UpdateAvatarNestCommandHandler,
  DeleteUserByAdminNestCommandHandler,
  DisplayUserNestQueryHandler,
  ListUsersNestQueryHandler,
  CheckPasswordResetTokenNestQueryHandler,
];

export const userUseCaseProviders: Provider[] = [
  {
    provide: USER_UNIQUENESS_CHECKER,
    useFactory: (users: UserRepositoryPort) => new UserUniquenessChecker(users),
    inject: [USER_REPOSITORY],
  },
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
    provide: CreateUserByAdminUseCase,
    useFactory: (
      users: UserRepositoryPort,
      uniquenessChecker: UserUniquenessCheckerPort,
      passwordHasher: PasswordHasherPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) =>
      new CreateUserByAdminUseCase(
        users,
        uniquenessChecker,
        passwordHasher,
        clock,
        transactional,
      ),
    inject: [
      USER_REPOSITORY,
      USER_UNIQUENESS_CHECKER,
      PASSWORD_HASHER,
      CLOCK,
      TRANSACTIONAL,
    ],
  },
  {
    provide: UpdateUserByAdminUseCase,
    useFactory: (
      users: UserRepositoryPort,
      uniquenessChecker: UserUniquenessCheckerPort,
      passwordHasher: PasswordHasherPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) =>
      new UpdateUserByAdminUseCase(
        users,
        uniquenessChecker,
        passwordHasher,
        clock,
        transactional,
      ),
    inject: [
      USER_REPOSITORY,
      USER_UNIQUENESS_CHECKER,
      PASSWORD_HASHER,
      CLOCK,
      TRANSACTIONAL,
    ],
  },
  {
    provide: UpdateAvatarUseCase,
    useFactory: (
      users: UserRepositoryPort,
      imageValidator: AvatarImageValidatorPort,
      uploader: AvatarUploaderPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) =>
      new UpdateAvatarUseCase(
        users,
        imageValidator,
        uploader,
        clock,
        transactional,
      ),
    inject: [
      USER_REPOSITORY,
      AVATAR_IMAGE_VALIDATOR,
      AVATAR_UPLOADER,
      CLOCK,
      TRANSACTIONAL,
    ],
  },
  {
    provide: UpdatePasswordUseCase,
    useFactory: (
      users: UserRepositoryPort,
      passwordHasher: PasswordHasherPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) =>
      new UpdatePasswordUseCase(users, passwordHasher, clock, transactional),
    inject: [USER_REPOSITORY, PASSWORD_HASHER, CLOCK, TRANSACTIONAL],
  },
  {
    provide: DeleteUserByAdminUseCase,
    useFactory: (
      users: UserRepositoryPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) => new DeleteUserByAdminUseCase(users, clock, transactional),
    inject: [USER_REPOSITORY, CLOCK, TRANSACTIONAL],
  },
  {
    provide: DisplayUserUseCase,
    useFactory: (users: UserRepositoryPort) => new DisplayUserUseCase(users),
    inject: [USER_REPOSITORY],
  },
  {
    provide: ListUsersUseCase,
    useFactory: (users: UserRepositoryPort) => new ListUsersUseCase(users),
    inject: [USER_REPOSITORY],
  },
  {
    provide: CheckPasswordResetTokenUseCase,
    useFactory: (
      users: UserRepositoryPort,
      tokenProvider: TokenProviderPort,
      clock: ClockPort,
    ) => new CheckPasswordResetTokenUseCase(users, tokenProvider, clock),
    inject: [USER_REPOSITORY, TOKEN_PROVIDER, CLOCK],
  },
];

export const userPortProviders: Provider[] = [
  PrismaTransactionContext,
  {
    provide: USER_REPOSITORY,
    useFactory: (
      prisma: PrismaService,
      transactionContext: PrismaTransactionContext,
      idGenerator: IdGeneratorPort,
    ) => new PrismaUserRepository(prisma, transactionContext, idGenerator),
    inject: [PrismaService, PrismaTransactionContext, ID_GENERATOR],
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
  {
    provide: AVATAR_UPLOADER,
    useFactory: (config: ConfigPort) => new DiskAvatarUploader(config),
    inject: [CONFIG],
  },
  {
    provide: AVATAR_URL_RESOLVER,
    useFactory: (config: ConfigPort) => new PathAvatarUrlResolver(config),
    inject: [CONFIG],
  },
  {
    provide: AVATAR_IMAGE_VALIDATOR,
    useFactory: (config: ConfigPort) => new SharpAvatarImageValidator(config),
    inject: [CONFIG],
  },
];
