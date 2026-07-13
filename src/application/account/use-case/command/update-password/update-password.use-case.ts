import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { UpdatePasswordCommand } from "@/application/account/use-case/command/update-password/update-password.command";
import type { PasswordHasherPort } from "@/application/shared/port/password-hasher.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { InvalidCurrentPasswordException } from "@/domain/user/exception/security/invalid-current-password.exception";
import { SamePasswordException } from "@/domain/user/exception/security/same-password.exception";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { PasswordHash } from "@/domain/user/value-object/security/password-hash";
import { UserId } from "@/domain/user/value-object/identity/user-id";

export class UpdatePasswordUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(command: UpdatePasswordCommand): Promise<void> {
    const userId = UserId.fromString(command.userId);
    const user = await this.users.findById(userId);

    if (user === null) {
      throw new UserNotFoundException(command.userId);
    }

    const currentPasswordHash = user.toSnapshot().passwordHash;

    const isCurrentPasswordValid = await this.passwordHasher.verify(
      currentPasswordHash,
      command.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCurrentPasswordException();
    }

    const isSameAsCurrentPassword = await this.passwordHasher.verify(
      currentPasswordHash,
      command.newPassword,
    );

    if (isSameAsCurrentPassword) {
      throw new SamePasswordException();
    }

    const passwordHash = PasswordHash.fromString(
      await this.passwordHasher.hash(command.newPassword),
    );

    await this.transactional.execute(async () => {
      user.changePassword(passwordHash, this.clock.now());

      await this.users.save(user);
    });
  }
}
