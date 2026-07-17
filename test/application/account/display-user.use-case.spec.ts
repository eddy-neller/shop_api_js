import { describe, expect, it } from "vitest";
import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { PasswordHasherPort } from "@/application/shared/port/password-hasher.port";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import { RegisterUserCommand } from "@/application/onboarding/use-case/command/register-user/register-user.command";
import { RegisterUserUseCase } from "@/application/onboarding/use-case/command/register-user/register-user.use-case";
import { DisplayUserQuery } from "@/application/account/use-case/query/display-user/display-user.query";
import { DisplayUserUseCase } from "@/application/account/use-case/query/display-user/display-user.use-case";
import { UserUniquenessChecker } from "@/application/shared/service/user-uniqueness-checker";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { InMemoryUserRepository } from "../user/in-memory-user.repository";

describe("DisplayUserUseCase", () => {
  it("returns an existing user", async () => {
    const repository = new InMemoryUserRepository();
    const register = makeRegisterUseCase(repository);
    const getById = new DisplayUserUseCase(repository);

    await register.execute(
      new RegisterUserCommand("john@example.com", "john", "ChangeMe123!"),
    );

    const user = await getById.execute(
      new DisplayUserQuery("11111111-1111-4111-8111-111111111111"),
    );

    expect(user.email).toBe("john@example.com");
  });

  it("rejects an unknown user", async () => {
    const repository = new InMemoryUserRepository();
    const getById = new DisplayUserUseCase(repository);

    await expect(
      getById.execute(
        new DisplayUserQuery("22222222-2222-4222-8222-222222222222"),
      ),
    ).rejects.toThrow(UserNotFoundException);
  });
});

function makeRegisterUseCase(
  repository: InMemoryUserRepository,
): RegisterUserUseCase {
  const hasher: PasswordHasherPort = {
    hash: () => Promise.resolve("hashed-password"),
    verify: () => Promise.resolve(true),
  };
  const tokenProvider: TokenProviderPort = {
    generateRandomToken: () => "activation-token",
    encode: (token, email) => `${email.toString()}&${token}`,
    split: () => ({}),
  };
  const clock: ClockPort = {
    now: () => new Date("2026-06-22T12:00:00.000Z"),
  };
  const transactional: TransactionalPort = {
    execute: (callback) => callback(),
  };
  const config: ConfigPort = {
    getString: () => "P2D",
    getNumber: (_name, defaultValue) => defaultValue ?? 0,
  };

  return new RegisterUserUseCase(
    repository,
    new UserUniquenessChecker(repository),
    hasher,
    tokenProvider,
    clock,
    transactional,
    config,
  );
}
