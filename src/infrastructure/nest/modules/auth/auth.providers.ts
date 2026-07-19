import type { Provider } from "@nestjs/common";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from "@/application/auth/port/refresh-token-repository.port";
import {
  REFRESH_TOKEN_HASHER,
  type RefreshTokenHasherPort,
} from "@/application/auth/port/refresh-token-hasher.port";
import {
  ACCESS_TOKEN_PROVIDER,
  type AccessTokenProviderPort,
} from "@/application/auth/port/access-token-provider.port";
import { AuthTokenIssuer } from "@/application/auth/service/auth-token-issuer";
import { LoginUseCase } from "@/application/auth/use-case/command/login/login.use-case";
import { LogoutUseCase } from "@/application/auth/use-case/command/logout/logout.use-case";
import { RefreshTokenUseCase } from "@/application/auth/use-case/command/refresh-token/refresh-token.use-case";
import type { ClockPort } from "@/application/shared/port/clock.port";
import { CLOCK } from "@/application/shared/port/clock.port";
import { CONFIG, type ConfigPort } from "@/application/shared/port/config.port";
import {
  ID_GENERATOR,
  type IdGeneratorPort,
} from "@/application/shared/port/id-generator.port";
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
import { LoginNestCommandHandler } from "@/infrastructure/nest/cqrs/auth/command/login.nest-command-handler";
import { LogoutNestCommandHandler } from "@/infrastructure/nest/cqrs/auth/command/logout.nest-command-handler";
import { RefreshTokenNestCommandHandler } from "@/infrastructure/nest/cqrs/auth/command/refresh-token.nest-command-handler";
import { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";
import { PrismaRefreshTokenRepository } from "@/infrastructure/persistence/refresh-token/prisma-refresh-token.repository";
import { Sha256RefreshTokenHasher } from "@/infrastructure/service/hasher/sha256-refresh-token-hasher";

export const authCqrsHandlers: Provider[] = [
  LoginNestCommandHandler,
  RefreshTokenNestCommandHandler,
  LogoutNestCommandHandler,
];

export const authUseCaseProviders: Provider[] = [
  {
    provide: LoginUseCase,
    useFactory: (
      users: UserRepositoryPort,
      passwordHasher: PasswordHasherPort,
      tokenIssuer: AuthTokenIssuer,
      clock: ClockPort,
      config: ConfigPort,
      transactional: TransactionalPort,
    ) =>
      new LoginUseCase(
        users,
        passwordHasher,
        tokenIssuer,
        clock,
        config,
        transactional,
      ),
    inject: [
      USER_REPOSITORY,
      PASSWORD_HASHER,
      AuthTokenIssuer,
      CLOCK,
      CONFIG,
      TRANSACTIONAL,
    ],
  },
  {
    provide: RefreshTokenUseCase,
    useFactory: (
      users: UserRepositoryPort,
      refreshTokens: RefreshTokenRepositoryPort,
      refreshTokenHasher: RefreshTokenHasherPort,
      tokenIssuer: AuthTokenIssuer,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) =>
      new RefreshTokenUseCase(
        users,
        refreshTokens,
        refreshTokenHasher,
        tokenIssuer,
        clock,
        transactional,
      ),
    inject: [
      USER_REPOSITORY,
      REFRESH_TOKEN_REPOSITORY,
      REFRESH_TOKEN_HASHER,
      AuthTokenIssuer,
      CLOCK,
      TRANSACTIONAL,
    ],
  },
  {
    provide: LogoutUseCase,
    useFactory: (
      refreshTokens: RefreshTokenRepositoryPort,
      refreshTokenHasher: RefreshTokenHasherPort,
      transactional: TransactionalPort,
    ) => new LogoutUseCase(refreshTokens, refreshTokenHasher, transactional),
    inject: [REFRESH_TOKEN_REPOSITORY, REFRESH_TOKEN_HASHER, TRANSACTIONAL],
  },
];

export const authServiceProviders: Provider[] = [
  {
    provide: AuthTokenIssuer,
    useFactory: (
      accessTokens: AccessTokenProviderPort,
      tokenProvider: TokenProviderPort,
      refreshTokenHasher: RefreshTokenHasherPort,
      refreshTokens: RefreshTokenRepositoryPort,
      config: ConfigPort,
    ) =>
      new AuthTokenIssuer(
        accessTokens,
        tokenProvider,
        refreshTokenHasher,
        refreshTokens,
        config,
      ),
    inject: [
      ACCESS_TOKEN_PROVIDER,
      TOKEN_PROVIDER,
      REFRESH_TOKEN_HASHER,
      REFRESH_TOKEN_REPOSITORY,
      CONFIG,
    ],
  },
];

export const authPortProviders: Provider[] = [
  {
    provide: REFRESH_TOKEN_REPOSITORY,
    useFactory: (
      prisma: PrismaService,
      transactionContext: PrismaTransactionContext,
      idGenerator: IdGeneratorPort,
    ) =>
      new PrismaRefreshTokenRepository(prisma, transactionContext, idGenerator),
    inject: [PrismaService, PrismaTransactionContext, ID_GENERATOR],
  },
  {
    provide: REFRESH_TOKEN_HASHER,
    useClass: Sha256RefreshTokenHasher,
  },
];
