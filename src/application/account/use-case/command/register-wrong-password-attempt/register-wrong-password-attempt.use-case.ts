import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { RegisterWrongPasswordAttemptCommand } from "@/application/account/use-case/command/register-wrong-password-attempt/register-wrong-password-attempt.command";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { Email } from "@/domain/user/value-object/identity/email";

export class RegisterWrongPasswordAttemptUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly clock: ClockPort,
    private readonly config: ConfigPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(
    command: RegisterWrongPasswordAttemptCommand,
  ): Promise<void> {
    const email = Email.fromString(command.email);
    const user = await this.users.findByEmail(email);

    if (user === null) {
      return;
    }

    await this.transactional.execute(async () => {
      user.registerWrongPasswordAttempt(
        this.config.getNumber("MAX_LOGIN_ATTEMPTS", 5),
        this.clock.now(),
      );

      await this.users.save(user);
    });
  }
}
