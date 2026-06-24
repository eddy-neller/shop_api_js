import { describe, expect, it } from "vitest";
import { UpdatePasswordCommand } from "@/application/user/use-case/command/update-password/update-password.command";
import { UpdatePasswordUseCase } from "@/application/user/use-case/command/update-password/update-password.use-case";
import { InvalidCurrentPasswordException } from "@/domain/user/exception/invalid-current-password.exception";
import { SamePasswordException } from "@/domain/user/exception/same-password.exception";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/email";
import { PasswordHash } from "@/domain/user/value-object/password-hash";
import { Preferences } from "@/domain/user/value-object/preferences";
import { UserId } from "@/domain/user/value-object/user-id";
import { UserRole } from "@/domain/user/value-object/user-role";
import { UserStatus } from "@/domain/user/value-object/user-status";
import { Username } from "@/domain/user/value-object/username";
import { fixedNow, makeClock, makeHasher, makeTransactional } from "./user-use-case-fixtures";
import { InMemoryUserRepository } from "./in-memory-user.repository";

const USER_ID = "11111111-1111-4111-8111-111111111111";

async function seedUser(repository: InMemoryUserRepository): Promise<void> {
  const user = User.createByAdmin({
    id: UserId.fromString(USER_ID),
    username: Username.fromString("john"),
    email: Email.fromString("john@example.com"),
    passwordHash: PasswordHash.fromString("old-hash"),
    roles: [UserRole.User],
    status: UserStatus.active(),
    preferences: new Preferences(),
    now: fixedNow,
  });

  await repository.save(user);
}

describe("UpdatePasswordUseCase", () => {
  it("changes the password when the current one is valid", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);

    const useCase = new UpdatePasswordUseCase(
      repository,
      makeHasher("new-hash", (_, plainPassword) => plainPassword === "OldPassword123!"),
      makeClock(),
      makeTransactional(),
    );

    await useCase.execute(
      new UpdatePasswordCommand(USER_ID, "OldPassword123!", "NewPassword123!"),
    );

    const stored = await repository.findById(UserId.fromString(USER_ID));
    expect(stored?.toSnapshot().passwordHash).toBe("new-hash");
  });

  it("rejects a new password identical to the current one", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);

    const useCase = new UpdatePasswordUseCase(
      repository,
      makeHasher("new-hash", true),
      makeClock(),
      makeTransactional(),
    );

    await expect(
      useCase.execute(
        new UpdatePasswordCommand(USER_ID, "OldPassword123!", "OldPassword123!"),
      ),
    ).rejects.toThrow(SamePasswordException);
  });

  it("rejects an invalid current password", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);

    const useCase = new UpdatePasswordUseCase(
      repository,
      makeHasher("new-hash", false),
      makeClock(),
      makeTransactional(),
    );

    await expect(
      useCase.execute(
        new UpdatePasswordCommand(USER_ID, "WrongPassword!", "NewPassword123!"),
      ),
    ).rejects.toThrow(InvalidCurrentPasswordException);
  });

  it("throws when the user does not exist", async () => {
    const repository = new InMemoryUserRepository();

    const useCase = new UpdatePasswordUseCase(
      repository,
      makeHasher("new-hash", true),
      makeClock(),
      makeTransactional(),
    );

    await expect(
      useCase.execute(
        new UpdatePasswordCommand(
          "22222222-2222-4222-8222-222222222222",
          "OldPassword123!",
          "NewPassword123!",
        ),
      ),
    ).rejects.toThrow(UserNotFoundException);
  });
});
