import { describe, expect, it } from "vitest";
import type { AvatarFile } from "@/application/user/port/avatar-uploader.port";
import { UpdateAvatarCommand } from "@/application/user/use-case/command/update-avatar/update-avatar.command";
import { UpdateAvatarUseCase } from "@/application/user/use-case/command/update-avatar/update-avatar.use-case";
import { InvalidAvatarException } from "@/domain/user/exception/invalid-avatar.exception";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/email";
import { PasswordHash } from "@/domain/user/value-object/password-hash";
import { Preferences } from "@/domain/user/value-object/preferences";
import { UserId } from "@/domain/user/value-object/user-id";
import { UserRole } from "@/domain/user/value-object/user-role";
import { UserStatus } from "@/domain/user/value-object/user-status";
import { Username } from "@/domain/user/value-object/username";
import {
  fixedNow,
  makeAvatarImageValidator,
  makeAvatarUploader,
  makeClock,
  makeTransactional,
} from "./user-use-case-fixtures";
import { InMemoryUserRepository } from "./in-memory-user.repository";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const UNKNOWN_ID = "22222222-2222-4222-8222-222222222222";

const file: AvatarFile = {
  buffer: Buffer.from("fake-image"),
  mimeType: "image/png",
  size: 10,
  originalName: "avatar.png",
};

async function seedUser(repository: InMemoryUserRepository): Promise<void> {
  const user = User.createByAdmin({
    id: UserId.fromString(USER_ID),
    username: Username.fromString("john"),
    email: Email.fromString("john@example.com"),
    passwordHash: PasswordHash.fromString("hash"),
    roles: [UserRole.User],
    status: UserStatus.active(),
    preferences: new Preferences(),
    now: fixedNow,
  });

  await repository.save(user);
}

describe("UpdateAvatarUseCase", () => {
  it("stores the uploaded avatar and returns the new avatar name", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);

    const useCase = new UpdateAvatarUseCase(
      repository,
      makeAvatarImageValidator(),
      makeAvatarUploader("avatar-hash.png"),      makeClock(),
      makeTransactional(),
    );

    const readModel = await useCase.execute(
      new UpdateAvatarCommand(USER_ID, file),
    );

    expect(readModel.avatarName).toBe("avatar-hash.png");

    const stored = await repository.findById(UserId.fromString(USER_ID));
    expect(stored?.toSnapshot().avatarName).toBe("avatar-hash.png");
  });

  it("throws when the user does not exist", async () => {
    const repository = new InMemoryUserRepository();

    const useCase = new UpdateAvatarUseCase(
      repository,
      makeAvatarImageValidator(),
      makeAvatarUploader(),      makeClock(),
      makeTransactional(),
    );

    await expect(
      useCase.execute(new UpdateAvatarCommand(UNKNOWN_ID, file)),
    ).rejects.toThrow(UserNotFoundException);
  });

  it("rejects an invalid image without persisting", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);

    const useCase = new UpdateAvatarUseCase(
      repository,
      makeAvatarImageValidator(false),
      makeAvatarUploader(),      makeClock(),
      makeTransactional(),
    );

    await expect(
      useCase.execute(new UpdateAvatarCommand(USER_ID, file)),
    ).rejects.toThrow(InvalidAvatarException);

    const stored = await repository.findById(UserId.fromString(USER_ID));
    expect(stored?.toSnapshot().avatarName).toBeNull();
  });

  it("deletes the previous avatar when replacing it", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository);

    const deletedNames: string[] = [];

    const first = new UpdateAvatarUseCase(
      repository,
      makeAvatarImageValidator(),
      makeAvatarUploader("first.png", deletedNames),      makeClock(),
      makeTransactional(),
    );
    await first.execute(new UpdateAvatarCommand(USER_ID, file));

    const second = new UpdateAvatarUseCase(
      repository,
      makeAvatarImageValidator(),
      makeAvatarUploader("second.png", deletedNames),      makeClock(),
      makeTransactional(),
    );
    await second.execute(new UpdateAvatarCommand(USER_ID, file));

    expect(deletedNames).toEqual(["first.png"]);

    const stored = await repository.findById(UserId.fromString(USER_ID));
    expect(stored?.toSnapshot().avatarName).toBe("second.png");
  });
});
