import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { CreateUserByAdminCommand } from "@/application/user/use-case/command/create-user-by-admin/create-user-by-admin.command";
import type { UserReadModel } from "@/application/user/dto/user-read-model";
import { toUserReadModel } from "@/application/user/dto/user-read-model.mapper";
import type { AvatarUrlResolverPort } from "@/application/user/port/avatar-url-resolver.port";
import type { PasswordHasherPort } from "@/application/user/port/password-hasher.port";
import type { UserUniquenessCheckerPort } from "@/application/user/port/user-uniqueness-checker.port";
import type { UserRepositoryPort } from "@/application/user/port/user-repository.port";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/email";
import { Firstname } from "@/domain/user/value-object/firstname";
import { Lastname } from "@/domain/user/value-object/lastname";
import { PasswordHash } from "@/domain/user/value-object/password-hash";
import { Preferences } from "@/domain/user/value-object/preferences";
import { toUserRole } from "@/domain/user/value-object/user-role";
import { UserStatus } from "@/domain/user/value-object/user-status";
import { Username } from "@/domain/user/value-object/username";

export class CreateUserByAdminUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly uniquenessChecker: UserUniquenessCheckerPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly avatarUrlResolver: AvatarUrlResolverPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(
    command: CreateUserByAdminCommand,
  ): Promise<UserReadModel> {
    return this.transactional.execute(async () => {
      const now = this.clock.now();
      const email = Email.fromString(command.email);
      const username = Username.fromString(command.username);

      await this.uniquenessChecker.ensureEmailAndUsernameAvailable(
        email,
        username,
      );

      const passwordHash = PasswordHash.fromString(
        await this.passwordHasher.hash(command.plainPassword),
      );

      const roles = command.roles.map(toUserRole);

      const user = User.createByAdmin({
        id: this.users.nextIdentity(),
        username,
        email,
        passwordHash,
        roles,
        status: UserStatus.fromNumber(command.status),
        preferences: new Preferences(),
        now,
        firstname:
          command.firstname !== null
            ? Firstname.fromString(command.firstname)
            : null,
        lastname:
          command.lastname !== null
            ? Lastname.fromString(command.lastname)
            : null,
      });

      await this.users.save(user);

      return toUserReadModel(
        user,
        this.avatarUrlResolver.resolve(user.toSnapshot().avatarName),
      );
    });
  }
}
