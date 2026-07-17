import { addIsoDuration } from "@/application/shared/date-interval";
import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { RequestPasswordResetCommand } from "@/application/account/use-case/command/request-password-reset/request-password-reset.command";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { Email } from "@/domain/user/value-object/identity/email";

export class RequestPasswordResetUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
    private readonly config: ConfigPort,
  ) {}

  public async execute(command: RequestPasswordResetCommand): Promise<void> {
    const email = Email.fromString(command.email);
    const token = this.tokenProvider.generateRandomToken();
    const now = this.clock.now();
    const expiresAt = addIsoDuration(
      now,
      this.config.getString("RESET_PASSWORD_TOKEN_TTL", "PT15M"),
    );

    await this.transactional.execute(async () => {
      const user = await this.users.findByEmail(email);

      if (user === null) {
        return;
      }

      user.requestPasswordReset(token, expiresAt, now);

      await this.users.save(user);
    });
  }
}
