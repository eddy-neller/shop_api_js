import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { ResetWrongPasswordAttemptsCommand } from "@/application/account/use-case/command/reset-wrong-password-attempts/reset-wrong-password-attempts.command";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { UserId } from "@/domain/user/value-object/identity/user-id";

export class ResetWrongPasswordAttemptsUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(
    command: ResetWrongPasswordAttemptsCommand,
  ): Promise<void> {
    const user = await this.users.findById(UserId.fromString(command.userId));

    if (user === null) {
      return;
    }

    await this.transactional.execute(async () => {
      user.resetWrongPasswordAttempts(this.clock.now());

      await this.users.save(user);
    });
  }
}
