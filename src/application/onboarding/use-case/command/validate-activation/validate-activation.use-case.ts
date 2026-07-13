import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { ValidateActivationCommand } from "@/application/onboarding/use-case/command/validate-activation/validate-activation.command";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { Email } from "@/domain/user/value-object/identity/email";

export class ValidateActivationUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(command: ValidateActivationCommand): Promise<void> {
    const split = this.tokenProvider.split(command.token);
    const email = Email.fromString(split.email ?? "");
    const rawToken = split.token ?? "";
    const user = await this.users.findByActivationToken(rawToken);

    if (user === null || user.toSnapshot().email !== email.toString()) {
      throw new UserNotFoundException("User not found for this token.");
    }

    await this.transactional.execute(async () => {
      user.activate(rawToken, this.clock.now());

      await this.users.save(user);
    });
  }
}
