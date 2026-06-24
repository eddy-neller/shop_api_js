import type { ClockPort } from "@/application/shared/port/clock.port";
import type { PasswordResetTokenCheckReadModel } from "@/application/user/dto/password-reset-token-check.read-model";
import type { CheckPasswordResetTokenQuery } from "@/application/user/use-case/query/check-password-reset-token/check-password-reset-token.query";
import type { TokenProviderPort } from "@/application/user/port/token-provider.port";
import type { UserRepositoryPort } from "@/application/user/port/user-repository.port";
import { Email } from "@/domain/user/value-object/email";

export class CheckPasswordResetTokenUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly clock: ClockPort,
  ) {}

  public async execute(
    query: CheckPasswordResetTokenQuery,
  ): Promise<PasswordResetTokenCheckReadModel> {
    const split = this.tokenProvider.split(query.token);
    const rawToken = split.token ?? "";

    let email: Email;
    try {
      email = Email.fromString(split.email ?? "");
    } catch {
      return { isValid: false };
    }

    const user = await this.users.findByResetPasswordToken(rawToken);

    if (user === null) {
      return { isValid: false };
    }

    const snapshot = user.toSnapshot();

    if (snapshot.email !== email.toString()) {
      return { isValid: false };
    }

    const resetPassword = snapshot.resetPassword;
    const ttl = resetPassword.tokenTtl ?? 0;
    const nowSeconds = Math.floor(this.clock.now().getTime() / 1000);

    if (ttl <= 0 || ttl <= nowSeconds) {
      return { isValid: false };
    }

    if (resetPassword.token !== rawToken) {
      return { isValid: false };
    }

    return { isValid: true };
  }
}
