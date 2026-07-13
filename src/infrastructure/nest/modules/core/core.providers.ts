import type { Provider } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ACCESS_TOKEN_PROVIDER } from "@/application/auth/port/access-token-provider.port";
import { AVATAR_URL_RESOLVER } from "@/application/account/port/avatar-url-resolver.port";
import { CLOCK } from "@/application/shared/port/clock.port";
import { CONFIG, type ConfigPort } from "@/application/shared/port/config.port";
import {
  ID_GENERATOR,
  type IdGeneratorPort,
} from "@/application/shared/port/id-generator.port";
import { PASSWORD_HASHER } from "@/application/shared/port/password-hasher.port";
import { TOKEN_PROVIDER } from "@/application/shared/port/token-provider.port";
import { TRANSACTIONAL } from "@/application/shared/port/transactional.port";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "@/application/shared/port/user-repository.port";
import { USER_UNIQUENESS_CHECKER } from "@/application/shared/port/user-uniqueness-checker.port";
import { UserUniquenessChecker } from "@/application/shared/service/user-uniqueness-checker";
import { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";
import { PrismaTransactional } from "@/infrastructure/persistence/prisma/transaction/prisma-transactional";
import { PrismaUserRepository } from "@/infrastructure/persistence/user/prisma-user.repository";
import { EnvConfig } from "@/infrastructure/service/config/env-config";
import { BcryptPasswordHasher } from "@/infrastructure/service/crypto/bcrypt-password-hasher";
import { UuidGenerator } from "@/infrastructure/service/id/uuid-generator";
import { PathAvatarUrlResolver } from "@/infrastructure/service/storage/path-avatar-url-resolver";
import { Base64TokenProvider } from "@/infrastructure/service/token/base64-token-provider";
import { JwtAccessTokenProvider } from "@/infrastructure/service/token/jwt-access-token-provider";
import { SystemClock } from "@/infrastructure/service/time/system-clock";

export const coreProviders: Provider[] = [
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
    provide: USER_UNIQUENESS_CHECKER,
    useFactory: (users: UserRepositoryPort) => new UserUniquenessChecker(users),
    inject: [USER_REPOSITORY],
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
    provide: ACCESS_TOKEN_PROVIDER,
    useFactory: (jwt: JwtService, config: ConfigPort) =>
      new JwtAccessTokenProvider(jwt, config),
    inject: [JwtService, CONFIG],
  },
  {
    provide: AVATAR_URL_RESOLVER,
    useFactory: (config: ConfigPort) => new PathAvatarUrlResolver(config),
    inject: [CONFIG],
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
