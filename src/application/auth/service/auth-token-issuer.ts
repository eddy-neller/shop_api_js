import { addIsoDuration } from "@/application/shared/date-interval";
import type { ConfigPort } from "@/application/shared/port/config.port";
import { AuthTokensReadModel } from "@/application/auth/dto/auth-tokens.read-model";
import type { AccessTokenProviderPort } from "@/application/auth/port/access-token-provider.port";
import type { AuthTokenIssuerPort } from "@/application/auth/port/auth-token-issuer.port";
import type { RefreshTokenHasherPort } from "@/application/auth/port/refresh-token-hasher.port";
import type { RefreshTokenRepositoryPort } from "@/application/auth/port/refresh-token-repository.port";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import { RefreshToken } from "@/domain/refresh-token/model/refresh-token.aggregate";
import { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import type { User } from "@/domain/user/model/user.aggregate";

export class AuthTokenIssuer implements AuthTokenIssuerPort {
  public constructor(
    private readonly accessTokens: AccessTokenProviderPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly refreshTokenHasher: RefreshTokenHasherPort,
    private readonly refreshTokens: RefreshTokenRepositoryPort,
    private readonly config: ConfigPort,
  ) {}

  public async issue(user: User, now: Date): Promise<AuthTokensReadModel> {
    const accessToken = this.accessTokens.issue({
      sub: user.getId().toString(),
      email: user.getEmail().toString(),
      username: user.getUsername().toString(),
      roles: user.getRoles(),
    });

    const rawRefreshToken = this.tokenProvider.generateRandomToken();
    const refreshExpiresAt = addIsoDuration(
      now,
      this.config.getString("JWT_REFRESH_TTL"),
    );

    const refreshToken = RefreshToken.issue({
      id: this.refreshTokens.nextIdentity(),
      userId: user.getId(),
      tokenHash: RefreshTokenHash.fromString(
        this.refreshTokenHasher.hash(rawRefreshToken),
      ),
      expiresAt: refreshExpiresAt,
      now,
    });

    await this.refreshTokens.save(refreshToken);

    return AuthTokensReadModel.of({
      accessToken: accessToken.token,
      refreshToken: rawRefreshToken,
      expiresIn: accessToken.expiresIn,
    });
  }
}
