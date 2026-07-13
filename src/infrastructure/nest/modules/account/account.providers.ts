import type { Provider } from "@nestjs/common";
import {
  AVATAR_IMAGE_VALIDATOR,
  type AvatarImageValidatorPort,
} from "@/application/account/port/avatar-image-validator.port";
import {
  AVATAR_UPLOADER,
  type AvatarUploaderPort,
} from "@/application/account/port/avatar-uploader.port";
import { ConfirmPasswordResetUseCase } from "@/application/account/use-case/command/confirm-password-reset/confirm-password-reset.use-case";
import { RegisterWrongPasswordAttemptUseCase } from "@/application/account/use-case/command/register-wrong-password-attempt/register-wrong-password-attempt.use-case";
import { RequestPasswordResetUseCase } from "@/application/account/use-case/command/request-password-reset/request-password-reset.use-case";
import { ResetWrongPasswordAttemptsUseCase } from "@/application/account/use-case/command/reset-wrong-password-attempts/reset-wrong-password-attempts.use-case";
import { UpdateAvatarUseCase } from "@/application/account/use-case/command/update-avatar/update-avatar.use-case";
import { UpdatePasswordUseCase } from "@/application/account/use-case/command/update-password/update-password.use-case";
import { CheckPasswordResetTokenUseCase } from "@/application/account/use-case/query/check-password-reset-token/check-password-reset-token.use-case";
import { DisplayUserUseCase } from "@/application/account/use-case/query/display-user/display-user.use-case";
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
import { ConfirmPasswordResetNestCommandHandler } from "@/infrastructure/nest/cqrs/account/command/confirm-password-reset.nest-command-handler";
import { RegisterWrongPasswordAttemptNestCommandHandler } from "@/infrastructure/nest/cqrs/account/command/register-wrong-password-attempt.nest-command-handler";
import { RequestPasswordResetNestCommandHandler } from "@/infrastructure/nest/cqrs/account/command/request-password-reset.nest-command-handler";
import { ResetWrongPasswordAttemptsNestCommandHandler } from "@/infrastructure/nest/cqrs/account/command/reset-wrong-password-attempts.nest-command-handler";
import { UpdateAvatarNestCommandHandler } from "@/infrastructure/nest/cqrs/account/command/update-avatar.nest-command-handler";
import { UpdatePasswordNestCommandHandler } from "@/infrastructure/nest/cqrs/account/command/update-password.nest-command-handler";
import { CheckPasswordResetTokenNestQueryHandler } from "@/infrastructure/nest/cqrs/account/query/check-password-reset-token.nest-query-handler";
import { DisplayUserNestQueryHandler } from "@/infrastructure/nest/cqrs/account/query/display-user.nest-query-handler";
import { DiskAvatarUploader } from "@/infrastructure/service/storage/disk-avatar-uploader";
import { SharpAvatarImageValidator } from "@/infrastructure/service/storage/sharp-avatar-image-validator";

export const accountCqrsHandlers: Provider[] = [
  RequestPasswordResetNestCommandHandler,
  ConfirmPasswordResetNestCommandHandler,
  RegisterWrongPasswordAttemptNestCommandHandler,
  ResetWrongPasswordAttemptsNestCommandHandler,
  UpdatePasswordNestCommandHandler,
  UpdateAvatarNestCommandHandler,
  DisplayUserNestQueryHandler,
  CheckPasswordResetTokenNestQueryHandler,
];

export const accountUseCaseProviders: Provider[] = [
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
    provide: DisplayUserUseCase,
    useFactory: (users: UserRepositoryPort) => new DisplayUserUseCase(users),
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

export const accountPortProviders: Provider[] = [
  {
    provide: AVATAR_UPLOADER,
    useFactory: (config: ConfigPort) => new DiskAvatarUploader(config),
    inject: [CONFIG],
  },
  {
    provide: AVATAR_IMAGE_VALIDATOR,
    useFactory: (config: ConfigPort) => new SharpAvatarImageValidator(config),
    inject: [CONFIG],
  },
];
