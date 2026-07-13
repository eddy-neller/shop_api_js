import { describe, expect, it } from "vitest";
import { CreateUserByAdminCommand } from "@/application/user-management/use-case/command/create-user-by-admin/create-user-by-admin.command";
import { CreateUserByAdminUseCase } from "@/application/user-management/use-case/command/create-user-by-admin/create-user-by-admin.use-case";
import { UpdateUserByAdminCommand } from "@/application/user-management/use-case/command/update-user-by-admin/update-user-by-admin.command";
import { UpdateUserByAdminUseCase } from "@/application/user-management/use-case/command/update-user-by-admin/update-user-by-admin.use-case";
import { InvalidRoleException } from "@/domain/user/exception/access/invalid-role.exception";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { UserStatus } from "@/domain/user/value-object/lifecycle/user-status";
import {
  makeClock,
  makeHasher,
  makeTransactional,
  makeUniquenessChecker,
} from "../user/user-use-case-fixtures";
import { InMemoryUserRepository } from "../user/in-memory-user.repository";

const USER_ID = "11111111-1111-4111-8111-111111111111";

async function seedUser(repository: InMemoryUserRepository): Promise<void> {
  const create = new CreateUserByAdminUseCase(
    repository,
    makeUniquenessChecker(repository),
    makeHasher("old-hash"),
    makeClock(),
    makeTransactional(),
  );

  await create.execute(
    new CreateUserByAdminCommand(
      "jane@example.com",
      "jane",
      "ChangeMe123!",
      ["ROLE_USER"],
      UserStatus.Active,
    ),
  );
}

function makeUseCase(
  repository: InMemoryUserRepository,
): UpdateUserByAdminUseCase {
  return new UpdateUserByAdminUseCase(
    repository,
    makeUniquenessChecker(repository),
    makeHasher("new-hash"),
    makeClock(),
    makeTransactional(),
  );
}

describe("UpdateUserByAdminUseCase", () => {
  it("updates only the provided fields", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);
    const useCase = makeUseCase(repository);

    const readModel = await useCase.execute(
      new UpdateUserByAdminCommand(
        USER_ID,
        null,
        "janet",
        null,
        ["ROLE_ADMIN"],
        null,
        "Janet",
      ),
    );

    expect(readModel.roles).toEqual(["ROLE_ADMIN"]);

    const stored = await repository.findById(repository.nextIdentity());
    expect(stored?.toSnapshot().username).toBe("janet");
    expect(stored?.toSnapshot().firstname).toBe("Janet");
    expect(stored?.toSnapshot().email).toBe("jane@example.com");
  });

  it("allows keeping the same email (uniqueness excludes self)", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);
    const useCase = makeUseCase(repository);

    await expect(
      useCase.execute(new UpdateUserByAdminCommand(USER_ID, "jane@example.com")),
    ).resolves.toMatchObject({ email: "jane@example.com" });
  });

  it("updates the password when a new one is provided", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);
    const useCase = makeUseCase(repository);

    await useCase.execute(
      new UpdateUserByAdminCommand(USER_ID, null, null, "NewPassword123!"),
    );

    const stored = await repository.findById(repository.nextIdentity());
    expect(stored?.toSnapshot().passwordHash).toBe("new-hash");
  });

  it("rejects assigning ROLE_SUPER_ADMIN", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);
    const useCase = makeUseCase(repository);

    await expect(
      useCase.execute(
        new UpdateUserByAdminCommand(USER_ID, null, null, null, [
          "ROLE_SUPER_ADMIN",
        ]),
      ),
    ).rejects.toThrow(InvalidRoleException);
  });

  it("throws when the user does not exist", async () => {
    const repository = new InMemoryUserRepository();
    const useCase = makeUseCase(repository);

    await expect(
      useCase.execute(
        new UpdateUserByAdminCommand("22222222-2222-4222-8222-222222222222"),
      ),
    ).rejects.toThrow(UserNotFoundException);
  });
});
