import { describe, expect, it } from "vitest";
import { CreateUserByAdminCommand } from "@/application/user-management/use-case/command/create-user-by-admin/create-user-by-admin.command";
import { CreateUserByAdminUseCase } from "@/application/user-management/use-case/command/create-user-by-admin/create-user-by-admin.use-case";
import { InvalidRoleException } from "@/domain/user/exception/access/invalid-role.exception";
import { EmailAlreadyUsedException } from "@/domain/user/exception/uniqueness/email-already-used.exception";
import { UserStatus } from "@/domain/user/value-object/lifecycle/user-status";
import {
  makeClock,
  makeHasher,
  makeTransactional,
  makeUniquenessChecker,
} from "../user/user-use-case-fixtures";
import { InMemoryUserRepository } from "../user/in-memory-user.repository";

function makeUseCase(
  repository: InMemoryUserRepository,
): CreateUserByAdminUseCase {
  return new CreateUserByAdminUseCase(
    repository,
    makeUniquenessChecker(repository),
    makeHasher(),
    makeClock(),
    makeTransactional(),
  );
}

describe("CreateUserByAdminUseCase", () => {
  it("creates an active user with explicit roles, status and names", async () => {
    const repository = new InMemoryUserRepository();
    const useCase = makeUseCase(repository);

    const readModel = await useCase.execute(
      new CreateUserByAdminCommand(
        "JANE@example.com",
        "jane",
        "ChangeMe123!",
        ["ROLE_USER", "ROLE_ADMIN"],
        UserStatus.Active,
        "Jane",
        "Doe",
      ),
    );

    expect(readModel).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      email: "jane@example.com",
      roles: ["ROLE_USER", "ROLE_ADMIN"],
    });

    const stored = await repository.findById(repository.nextIdentity());
    expect(stored?.toSnapshot().status).toBe(UserStatus.Active);
    expect(stored?.toSnapshot().firstname).toBe("Jane");
  });

  it("rejects an already used email", async () => {
    const repository = new InMemoryUserRepository();
    const useCase = makeUseCase(repository);

    await useCase.execute(
      new CreateUserByAdminCommand(
        "jane@example.com",
        "jane",
        "ChangeMe123!",
        ["ROLE_USER"],
        UserStatus.Active,
      ),
    );

    await expect(
      useCase.execute(
        new CreateUserByAdminCommand(
          "jane@example.com",
          "jane2",
          "ChangeMe123!",
          ["ROLE_USER"],
          UserStatus.Active,
        ),
      ),
    ).rejects.toThrow(EmailAlreadyUsedException);
  });

  it("rejects an unknown role", async () => {
    const repository = new InMemoryUserRepository();
    const useCase = makeUseCase(repository);

    await expect(
      useCase.execute(
        new CreateUserByAdminCommand(
          "jane@example.com",
          "jane",
          "ChangeMe123!",
          ["ROLE_UNKNOWN"],
          UserStatus.Active,
        ),
      ),
    ).rejects.toThrow(InvalidRoleException);
  });

  it("rejects assigning ROLE_SUPER_ADMIN", async () => {
    const repository = new InMemoryUserRepository();
    const useCase = makeUseCase(repository);

    await expect(
      useCase.execute(
        new CreateUserByAdminCommand(
          "jane@example.com",
          "jane",
          "ChangeMe123!",
          ["ROLE_USER", "ROLE_SUPER_ADMIN"],
          UserStatus.Active,
        ),
      ),
    ).rejects.toThrow(InvalidRoleException);
  });
});
