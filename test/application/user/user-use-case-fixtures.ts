import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { AvatarImageValidatorPort } from "@/application/user/port/avatar-image-validator.port";
import type { AvatarUploaderPort } from "@/application/user/port/avatar-uploader.port";
import type { AvatarUrlResolverPort } from "@/application/user/port/avatar-url-resolver.port";
import type { PasswordHasherPort } from "@/application/user/port/password-hasher.port";
import type { TokenProviderPort } from "@/application/user/port/token-provider.port";
import { UserUniquenessChecker } from "@/application/user/service/user-uniqueness-checker";
import { InvalidAvatarException } from "@/domain/user/exception/invalid-avatar.exception";
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
