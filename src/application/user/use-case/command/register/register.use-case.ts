import { addIsoDuration } from "@/application/shared/date-interval";
import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { RegisterUserCommand } from "@/application/user/use-case/command/register/register.command";
import type { UserReadModel } from "@/application/user/dto/user-read-model";
import { toUserReadModel } from "@/application/user/dto/user-read-model.mapper";
import type { IdGeneratorPort } from "@/application/user/port/id-generator.port";
import type { PasswordHasherPort } from "@/application/user/port/password-hasher.port";
import type { TokenProviderPort } from "@/application/user/port/token-provider.port";
import type { UserUniquenessCheckerPort } from "@/application/user/port/user-uniqueness-checker.port";
import type { UserRepositoryPort } from "@/application/user/port/user-repository.port";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/email";
import { PasswordHash } from "@/domain/user/value-object/password-hash";
import { Preferences } from "@/domain/user/value-object/preferences";
import { UserId } from "@/domain/user/value-object/user-id";
import { Username } from "@/domain/user/value-object/username";

export class RegisterUserUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly uniquenessChecker: UserUniquenessCheckerPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
    private readonly config: ConfigPort,
  ) {}

  public async execute(command: RegisterUserCommand): Promise<UserReadModel> {
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

      const user = User.register({
        id: UserId.fromString(this.idGenerator.generate()),
        username,
        email,
        passwordHash,
        preferences: Preferences.fromObject(command.preferences ?? {}),
        now,
      });

      const token = this.tokenProvider.generateRandomToken();
      const expiresAt = addIsoDuration(
        now,
        this.config.getString("REGISTER_TOKEN_TTL", "P2D"),
      );

      user.requestActivation(token, expiresAt, now);

      await this.users.save(user);

      return toUserReadModel(user);
    });
  }
}
