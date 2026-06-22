import { describe, expect, it } from "vitest";
import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { IdGeneratorPort } from "@/application/user/port/id-generator.port";
import type { PasswordHasherPort } from "@/application/user/port/password-hasher.port";
import type { TokenProviderPort } from "@/application/user/port/token-provider.port";
import { RegisterUserCommand } from "@/application/user/use-case/command/register/register.command";
import { RegisterUserUseCase } from "@/application/user/use-case/command/register/register.use-case";
import { GetUserByIdQuery } from "@/application/user/use-case/query/get-by-id/get-by-id.query";
import { GetUserByIdUseCase } from "@/application/user/use-case/query/get-by-id/get-by-id.use-case";
import { UserUniquenessChecker } from "@/application/user/service/user-uniqueness-checker";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { InMemoryUserRepository } from "./in-memory-user.repository";

describe("GetUserByIdUseCase", () => {
  it("returns an existing user", async () => {
    const repository = new InMemoryUserRepository();
    const register = makeRegisterUseCase(repository);
    const getById = new GetUserByIdUseCase(repository);

    await register.execute(
      new RegisterUserCommand("john@example.com", "john", "ChangeMe123!"),
    );

    const user = await getById.execute(
      new GetUserByIdQuery("11111111-1111-4111-8111-111111111111"),
    );

    expect(user.email).toBe("john@example.com");
  });

  it("rejects an unknown user", async () => {
    const repository = new InMemoryUserRepository();
    const getById = new GetUserByIdUseCase(repository);

    await expect(
      getById.execute(
        new GetUserByIdQuery("22222222-2222-4222-8222-222222222222"),
      ),
    ).rejects.toThrow(UserNotFoundException);
  });
});

function makeRegisterUseCase(
  repository: InMemoryUserRepository,
): RegisterUserUseCase {
  const hasher: PasswordHasherPort = {
    hash: () => Promise.resolve("hashed-password"),
  };
  const idGenerator: IdGeneratorPort = {
    generate: () => "11111111-1111-4111-8111-111111111111",
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
    idGenerator,
    tokenProvider,
    clock,
    transactional,
    config,
  );
}
