import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { UpdateUserByAdminCommand } from "@/application/user/use-case/command/update-user-by-admin/update-user-by-admin.command";
import { UserReadModel } from "@/application/user/dto/user-read-model";
import type { PasswordHasherPort } from "@/application/user/port/password-hasher.port";
import type { UserUniquenessCheckerPort } from "@/application/user/port/user-uniqueness-checker.port";
import type { UserRepositoryPort } from "@/application/user/port/user-repository.port";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { Email } from "@/domain/user/value-object/email";
import { Firstname } from "@/domain/user/value-object/firstname";
import { Lastname } from "@/domain/user/value-object/lastname";
import { PasswordHash } from "@/domain/user/value-object/password-hash";
import { UserId } from "@/domain/user/value-object/user-id";
import {
  type UserRole,
  toUserRole,
} from "@/domain/user/value-object/user-role";
import { UserStatus } from "@/domain/user/value-object/user-status";
import { Username } from "@/domain/user/value-object/username";

export class UpdateUserByAdminUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly uniquenessChecker: UserUniquenessCheckerPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(
    command: UpdateUserByAdminCommand,
  ): Promise<UserReadModel> {
    const userId = UserId.fromString(command.userId);
    const user = await this.users.findById(userId);

    if (user === null) {
      throw new UserNotFoundException(command.userId);
    }

    const email =
      command.email !== null ? Email.fromString(command.email) : null;
    const username =
      command.username !== null ? Username.fromString(command.username) : null;

    if (email !== null) {
      await this.uniquenessChecker.ensureEmailAvailable(email, userId);
    }

    if (username !== null) {
      await this.uniquenessChecker.ensureUsernameAvailable(username, userId);
    }

    const roles: UserRole[] | null =
      command.roles !== null ? command.roles.map(toUserRole) : null;

    const status =
      command.status !== null ? UserStatus.fromNumber(command.status) : null;
    const firstname =
      command.firstname !== null
        ? Firstname.fromString(command.firstname)
        : null;
    const lastname =
      command.lastname !== null ? Lastname.fromString(command.lastname) : null;

    return this.transactional.execute(async () => {
      const passwordHash =
        command.plainPassword !== null && command.plainPassword.trim() !== ""
          ? PasswordHash.fromString(
              await this.passwordHasher.hash(command.plainPassword),
            )
          : null;

      user.updateByAdmin({
        now: this.clock.now(),
        username,
        email,
        firstname,
        lastname,
        roles,
        status,
        passwordHash,
      });

      await this.users.save(user);

      return UserReadModel.fromUser(user);
    });
  }
}
