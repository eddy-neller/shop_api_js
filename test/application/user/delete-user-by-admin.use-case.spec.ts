import { describe, expect, it } from "vitest";
import { DeleteUserByAdminCommand } from "@/application/user/use-case/command/delete-user-by-admin/delete-user-by-admin.command";
import { DeleteUserByAdminUseCase } from "@/application/user/use-case/command/delete-user-by-admin/delete-user-by-admin.use-case";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/email";
import { PasswordHash } from "@/domain/user/value-object/password-hash";
import { Preferences } from "@/domain/user/value-object/preferences";
import { UserId } from "@/domain/user/value-object/user-id";
import { UserRole } from "@/domain/user/value-object/user-role";
import { UserStatus } from "@/domain/user/value-object/user-status";
import { Username } from "@/domain/user/value-object/username";
import { fixedNow, makeClock, makeTransactional } from "./user-use-case-fixtures";
import { InMemoryUserRepository } from "./in-memory-user.repository";

const USER_ID = "11111111-1111-4111-8111-111111111111";

describe("DeleteUserByAdminUseCase", () => {
  it("deletes an existing user", async () => {
    const repository = new InMemoryUserRepository();
    await repository.save(
      User.createByAdmin({
        id: UserId.fromString(USER_ID),
        username: Username.fromString("john"),
        email: Email.fromString("john@example.com"),
        passwordHash: PasswordHash.fromString("hashed-password"),
        roles: [UserRole.User],
        status: UserStatus.active(),
        preferences: new Preferences(),
        now: fixedNow,
      }),
    );

    const useCase = new DeleteUserByAdminUseCase(
      repository,
      makeClock(),
      makeTransactional(),
    );

    await useCase.execute(new DeleteUserByAdminCommand(USER_ID));

    expect(await repository.findById(UserId.fromString(USER_ID))).toBeNull();
  });

  it("throws when the user does not exist", async () => {
    const repository = new InMemoryUserRepository();
    const useCase = new DeleteUserByAdminUseCase(
      repository,
      makeClock(),
      makeTransactional(),
    );

    await expect(
      useCase.execute(new DeleteUserByAdminCommand(USER_ID)),
    ).rejects.toThrow(UserNotFoundException);
  });
});
