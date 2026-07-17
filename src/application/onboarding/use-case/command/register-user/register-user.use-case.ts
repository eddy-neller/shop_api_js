import { addIsoDuration } from "@/application/shared/date-interval";
import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { RegisterUserCommand } from "@/application/onboarding/use-case/command/register-user/register-user.command";
import { UserReadModel } from "@/application/shared/dto/user-read-model";
import type { PasswordHasherPort } from "@/application/shared/port/password-hasher.port";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import type { UserUniquenessCheckerPort } from "@/application/shared/port/user-uniqueness-checker.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/identity/email";
import { PasswordHash } from "@/domain/user/value-object/security/password-hash";
import { Preferences } from "@/domain/user/value-object/profile/preferences";
import { Username } from "@/domain/user/value-object/identity/username";

export class RegisterUserUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly uniquenessChecker: UserUniquenessCheckerPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
    private readonly config: ConfigPort,
  ) {}

  public async execute(command: RegisterUserCommand): Promise<UserReadModel> {
    const username = Username.fromString(command.username);
    const email = Email.fromString(command.email);
    const preferences = Preferences.fromObject(command.preferences ?? {});
    const passwordHash = PasswordHash.fromString(
      await this.passwordHasher.hash(command.plainPassword),
    );

    const now = this.clock.now();
    const user = User.register({
      id: this.users.nextIdentity(),
      username,
      email,
      passwordHash,
      preferences: preferences,
      now,
    });
    const token = this.tokenProvider.generateRandomToken();
    const expiresAt = addIsoDuration(
      now,
      this.config.getString("REGISTER_TOKEN_TTL", "P2D"),
    );

    user.requestActivation(token, expiresAt, now);

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
