import { addIsoDuration } from "@/application/shared/date-interval";
import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import type { RequestActivationEmailCommand } from "@/application/onboarding/use-case/command/request-activation-email/request-activation-email.command";
import { Email } from "@/domain/user/value-object/identity/email";

export class RequestActivationEmailUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
    private readonly config: ConfigPort,
  ) {}

  public async execute(command: RequestActivationEmailCommand): Promise<void> {
    const email = Email.fromString(command.email);
    const now = this.clock.now();
    const token = this.tokenProvider.generateRandomToken();
    const expiresAt = addIsoDuration(
      now,
      this.config.getString("REGISTER_TOKEN_TTL"),
    );

    await this.transactional.execute(async () => {
      const user = await this.users.findByEmail(email);

      if (user === null) {
        return;
      }

      user.requestActivation(token, expiresAt, now);

      await this.users.save(user);
    });
  }
}
