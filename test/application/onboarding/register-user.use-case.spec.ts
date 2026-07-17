import { describe, expect, it } from "vitest";
import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { PasswordHasherPort } from "@/application/shared/port/password-hasher.port";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import { RegisterUserCommand } from "@/application/onboarding/use-case/command/register-user/register-user.command";
import { RegisterUserUseCase } from "@/application/onboarding/use-case/command/register-user/register-user.use-case";
import { UserUniquenessChecker } from "@/application/shared/service/user-uniqueness-checker";
import { EmailAlreadyUsedException } from "@/domain/user/exception/uniqueness/email-already-used.exception";
import { InvalidEmailException } from "@/domain/user/exception/identity/invalid-email.exception";
import { makeTransactionalSpy } from "../user/user-use-case-fixtures";
import { InMemoryUserRepository } from "../user/in-memory-user.repository";

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

  it("does not open a transaction when pure input validation fails", async () => {
    const repository = new InMemoryUserRepository();
    const transaction = makeTransactionalSpy();
    const useCase = makeUseCase(repository, transaction.transactional);

    await expect(
      useCase.execute(
        new RegisterUserCommand("invalid-email", "john", "ChangeMe123!"),
      ),
    ).rejects.toThrow(InvalidEmailException);

    expect(transaction.getCallCount()).toBe(0);
  });
});

function makeUseCase(
  repository: InMemoryUserRepository,
  transactional: TransactionalPort = {
    execute: (callback) => callback(),
  },
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
