import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { IdGeneratorPort } from "@/application/user/port/id-generator.port";
import type { PasswordHasherPort } from "@/application/user/port/password-hasher.port";
import type { TokenProviderPort } from "@/application/user/port/token-provider.port";
import { UserUniquenessChecker } from "@/application/user/service/user-uniqueness-checker";
import type { InMemoryUserRepository } from "./in-memory-user.repository";

export const fixedNow = new Date("2026-06-22T12:00:00.000Z");

export function makeHasher(hash = "hashed-password"): PasswordHasherPort {
  return {
    hash: () => Promise.resolve(hash),
  };
}

export function makeIdGenerator(
  id = "11111111-1111-4111-8111-111111111111",
): IdGeneratorPort {
  return {
    generate: () => id,
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
