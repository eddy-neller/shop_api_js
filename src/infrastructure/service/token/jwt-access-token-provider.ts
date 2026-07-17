import type { JwtService } from "@nestjs/jwt";
import { addIsoDuration } from "@/application/shared/date-interval";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type {
  AccessTokenClaims,
  AccessTokenProviderPort,
  IssuedAccessToken,
} from "@/application/auth/port/access-token-provider.port";
import { InvalidCredentialsException } from "@/domain/user/exception/security/invalid-credentials.exception";

type AccessTokenPayload = {
  sub: string;
  email: string;
  username: string;
  roles: string[];
};

export class JwtAccessTokenProvider implements AccessTokenProviderPort {
  public constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigPort,
  ) {}

  public issue(claims: AccessTokenClaims): IssuedAccessToken {
    const expiresIn = this.accessTtlSeconds();

    const token = this.jwt.sign(
      {
        email: claims.email,
        username: claims.username,
        roles: claims.roles,
      },
      { secret: this.secret(), subject: claims.sub, expiresIn },
    );

    return { token, expiresIn };
  }

  public verify(token: string): AccessTokenClaims {
    let payload: AccessTokenPayload;

    try {
      payload = this.jwt.verify<AccessTokenPayload>(token, {
        secret: this.secret(),
      });
    } catch {
      throw new InvalidCredentialsException();
    }

    return {
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
      roles: payload.roles,
    };
  }

  private secret(): string {
    const secret = this.config.getString("JWT_SECRET");

    if (secret.trim() === "") {
      throw new Error("JWT_SECRET must be defined.");
    }

    return secret;
  }

  private accessTtlSeconds(): number {
    const ttl = this.config.getString("JWT_ACCESS_TTL");
    const base = new Date(0);

    return Math.floor(
      (addIsoDuration(base, ttl).getTime() - base.getTime()) / 1000,
    );
  }
}
