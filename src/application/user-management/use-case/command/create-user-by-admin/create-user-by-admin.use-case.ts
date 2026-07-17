import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { CreateUserByAdminCommand } from "@/application/user-management/use-case/command/create-user-by-admin/create-user-by-admin.command";
import { UserReadModel } from "@/application/shared/dto/user-read-model";
import type { PasswordHasherPort } from "@/application/shared/port/password-hasher.port";
import type { UserUniquenessCheckerPort } from "@/application/shared/port/user-uniqueness-checker.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/identity/email";
import { Firstname } from "@/domain/user/value-object/profile/firstname";
import { Lastname } from "@/domain/user/value-object/profile/lastname";
import { PasswordHash } from "@/domain/user/value-object/security/password-hash";
import { Preferences } from "@/domain/user/value-object/profile/preferences";
import { toUserRole } from "@/domain/user/value-object/access/user-role";
import { UserStatus } from "@/domain/user/value-object/lifecycle/user-status";
import { Username } from "@/domain/user/value-object/identity/username";

export class CreateUserByAdminUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly uniquenessChecker: UserUniquenessCheckerPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(
    command: CreateUserByAdminCommand,
  ): Promise<UserReadModel> {
    const username = Username.fromString(command.username);
    const email = Email.fromString(command.email);
    const passwordHash = PasswordHash.fromString(
      await this.passwordHasher.hash(command.plainPassword),
    );
    const roles = command.roles.map(toUserRole);
    const status = UserStatus.fromNumber(command.status);
    const firstname = command.firstname !== null
      ? Firstname.fromString(command.firstname)
      : null;
    const lastname = command.lastname !== null
      ? Lastname.fromString(command.lastname)
      : null;

    const now = this.clock.now();
    const user = User.createByAdmin({
      id: this.users.nextIdentity(),
      username,
      email,
      passwordHash,
      roles,
      status: status,
      preferences: new Preferences(),
      now,
      firstname: firstname,
      lastname: lastname,
    });

    return this.transactional.execute(async () => {
      await this.uniquenessChecker.ensureEmailAndUsernameAvailable(
        email,
        username,
      );

      await this.users.save(user);

      return UserReadModel.fromUser(user);
    });
  }
}
