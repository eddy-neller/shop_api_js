import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { AccessTokenProviderPort } from "@/application/auth/port/access-token-provider.port";
import type { AvatarImageValidatorPort } from "@/application/account/port/avatar-image-validator.port";
import type { AvatarUploaderPort } from "@/application/account/port/avatar-uploader.port";
import type { AvatarUrlResolverPort } from "@/application/account/port/avatar-url-resolver.port";
import type { PasswordHasherPort } from "@/application/shared/port/password-hasher.port";
import type { RefreshTokenHasherPort } from "@/application/auth/port/refresh-token-hasher.port";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import { AuthTokenIssuer } from "@/application/auth/service/auth-token-issuer";
import { UserUniquenessChecker } from "@/application/shared/service/user-uniqueness-checker";
import { RefreshToken } from "@/domain/refresh-token/model/refresh-token.aggregate";
import { InvalidAvatarException } from "@/domain/user/exception/profile/invalid-avatar.exception";
import type { InMemoryRefreshTokenRepository } from "./in-memory-refresh-token.repository";
import type { InMemoryUserRepository } from "./in-memory-user.repository";

export const fixedNow = new Date("2026-06-22T12:00:00.000Z");

export function makeHasher(
  hash = "hashed-password",
  verifyResult:
    | boolean
    | ((storedHash: string, plainPassword: string) => boolean) = true,
): PasswordHasherPort {
  return {
    hash: () => Promise.resolve(hash),
    verify: (storedHash, plainPassword) =>
      Promise.resolve(
        typeof verifyResult === "function"
          ? verifyResult(storedHash, plainPassword)
          : verifyResult,
      ),
  };
}

export function makeClock(now = fixedNow): ClockPort {
  return {
    now: () => now,
  };
}

export function makeTransactional(): TransactionalPort {
  return {
    execute: (callback) => callback(),
  };
}

export function makeConfig(): ConfigPort {
  return {
    getString: (name, defaultValue) => {
      if (name === "REGISTER_TOKEN_TTL") {
        return "P2D";
      }

      if (name === "RESET_PASSWORD_TOKEN_TTL") {
        return "PT15M";
      }

      return defaultValue;
    },
    getNumber: (name, defaultValue) =>
      name === "MAX_LOGIN_ATTEMPTS" ? 2 : defaultValue,
  };
}

export function makeAccessTokenProvider(
  token = "access-token",
  expiresIn = 900,
): AccessTokenProviderPort {
  return {
    issue: () => ({ token, expiresIn }),
    verify: () => ({ sub: "", email: "", username: "", roles: [] }),
  };
}

// Hash deterministe et prefixe: le hash reste distinct du secret brut tout en
// restant reproductible, comme le fait le vrai adapter SHA-256.
export function makeRefreshTokenHasher(): RefreshTokenHasherPort {
  return {
    hash: (rawToken) => `sha:${rawToken}`,
  };
}

// Semer un refresh token dans un etat arbitraire (y compris expire) sans passer
// par l'invariant "expire dans le futur" de RefreshToken.issue.
export function makeRefreshToken(params: {
  rawToken: string;
  expiresAt: Date;
  userId?: string;
  id?: string;
  createdAt?: Date;
}): RefreshToken {
  return RefreshToken.fromSnapshot({
    id: params.id ?? "22222222-2222-4222-8222-222222222222",
    userId: params.userId ?? "11111111-1111-4111-8111-111111111111",
    tokenHash: makeRefreshTokenHasher().hash(params.rawToken),
    expiresAt: params.expiresAt,
    createdAt: params.createdAt ?? fixedNow,
  });
}

export function makeTokenProvider(token = "raw-token"): TokenProviderPort {
  return {
    generateRandomToken: () => token,
    encode: (rawToken, email) =>
      Buffer.from(`${email.toString()}&${rawToken}`).toString("base64"),
    split: (encodedToken) => {
      const decoded = Buffer.from(encodedToken, "base64").toString("utf8");
      const [email, rawToken] = decoded.split("&");

      return { email, token: rawToken };
    },
  };
}

export function makeUniquenessChecker(
  repository: InMemoryUserRepository,
): UserUniquenessChecker {
  return new UserUniquenessChecker(repository);
}

export function makeTokenIssuer(
  refreshTokens: InMemoryRefreshTokenRepository,
  rawRefreshToken = "refresh-token",
): AuthTokenIssuer {
  return new AuthTokenIssuer(
    makeAccessTokenProvider(),
    makeTokenProvider(rawRefreshToken),
    makeRefreshTokenHasher(),
    refreshTokens,
    makeConfig(),
  );
}

export function makeAvatarUrlResolver(
  baseUrl = "/uploads/images/user/avatar",
): AvatarUrlResolverPort {
  return {
    resolve: (avatarName) =>
      avatarName === null ? null : `${baseUrl}/${avatarName}`,
  };
}

export function makeAvatarUploader(
  avatarName = "avatar-hash.png",
  deletedNames: string[] = [],
): AvatarUploaderPort {
  return {
    upload: () => Promise.resolve(avatarName),
    delete: (name) => {
      deletedNames.push(name);

      return Promise.resolve();
    },
  };
}

export function makeAvatarImageValidator(
  valid = true,
): AvatarImageValidatorPort {
  return {
    validate: () =>
      valid
        ? Promise.resolve()
        : Promise.reject(InvalidAvatarException.invalidMimeType("text/plain")),
  };
}
