import { describe, expect, it } from "vitest";
import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { PasswordHasherPort } from "@/application/user/port/password-hasher.port";
import type { TokenProviderPort } from "@/application/user/port/token-provider.port";
import { RegisterUserCommand } from "@/application/user/use-case/command/register-user/register-user.command";
import { RegisterUserUseCase } from "@/application/user/use-case/command/register-user/register-user.use-case";
import { UserUniquenessChecker } from "@/application/user/service/user-uniqueness-checker";
import { EmailAlreadyUsedException } from "@/domain/user/exception/uniqueness/email-already-used.exception";
import { InMemoryUserRepository } from "./in-memory-user.repository";

describe("RegisterUserUseCase", () => {
  it("registers a new user", async () => {
    const repository = new InMemoryUserRepository();
    const useCase = makeUseCase(repository);

    const user = await useCase.execute(
      new RegisterUserCommand("JOHN@example.com", "john", "ChangeMe123!"),
    );

    expect(user).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      email: "john@example.com",
      roles: ["ROLE_USER"],
    });
  });

  it("rejects an already used email", async () => {
    const repository = new InMemoryUserRepository();
    const useCase = makeUseCase(repository);

    await useCase.execute(
      new RegisterUserCommand("john@example.com", "john", "ChangeMe123!"),
    );

    await expect(
      useCase.execute(
        new RegisterUserCommand("JOHN@example.com", "john2", "ChangeMe123!"),
      ),
    ).rejects.toThrow(EmailAlreadyUsedException);
  });
});

function makeUseCase(repository: InMemoryUserRepository): RegisterUserUseCase {
  const hasher: PasswordHasherPort = {
    hash: () => Promise.resolve("hashed-password"),
    verify: () => Promise.resolve(true),
  };
  const tokenProvider: TokenProviderPort = {
    generateRandomToken: () => "activation-token",
    encode: (token, email) => `${email.toString()}&${token}`,
    split: () => ({})
  };
  const clock: ClockPort = {
    now: () => new Date("2026-06-22T12:00:00.000Z"),
  };
  const transactional: TransactionalPort = {
    execute: (callback) => callback(),
  };
  const config: ConfigPort = {
    getString: () => "P2D",
    getNumber: (_name, defaultValue) => defaultValue,
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
