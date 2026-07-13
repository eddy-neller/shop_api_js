import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { AuthTokensReadModel } from "@/application/auth/dto/auth-tokens.read-model";
import type { AuthTokenIssuerPort } from "@/application/auth/port/auth-token-issuer.port";
import type { RefreshTokenHasherPort } from "@/application/auth/port/refresh-token-hasher.port";
import type { RefreshTokenRepositoryPort } from "@/application/auth/port/refresh-token-repository.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import type { RefreshTokenCommand } from "@/application/auth/use-case/command/refresh-token/refresh-token.command";
import { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import { InvalidRefreshTokenException } from "@/domain/user/exception/security/invalid-refresh-token.exception";

export class RefreshTokenUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly refreshTokens: RefreshTokenRepositoryPort,
    private readonly refreshTokenHasher: RefreshTokenHasherPort,
    private readonly tokenIssuer: AuthTokenIssuerPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(
    command: RefreshTokenCommand,
  ): Promise<AuthTokensReadModel> {
    return this.transactional.execute(async () => {
      const now = this.clock.now();
      const hash = RefreshTokenHash.fromString(
        this.refreshTokenHasher.hash(command.refreshToken),
      );
      const storedToken = await this.refreshTokens.findByHash(hash);

      if (storedToken === null) {
        throw new InvalidRefreshTokenException();
      }

      if (storedToken.isExpired(now)) {
        await this.refreshTokens.delete(storedToken);
        throw new InvalidRefreshTokenException();
      }

      const user = await this.users.findById(storedToken.getUserId());

      if (user === null || user.isLocked() || !user.isActive()) {
        await this.refreshTokens.delete(storedToken);
        throw new InvalidRefreshTokenException();
      }

      // Usage unique: l'ancien refresh token est revoque avant d'en emettre un nouveau (rotation).
      await this.refreshTokens.delete(storedToken);

      return this.tokenIssuer.issue(user, now);
    });
  }
}
