import type { ClockPort } from "@/application/shared/port/clock.port";
import type { PasswordResetTokenCheckReadModel } from "@/application/account/dto/password-reset-token-check.read-model";
import type { CheckPasswordResetTokenQuery } from "@/application/account/use-case/query/check-password-reset-token/check-password-reset-token.query";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { Email } from "@/domain/user/value-object/identity/email";

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

    if (!user.getEmail().equals(email)) {
      return { isValid: false };
    }

    const resetPassword = user.getResetPassword();
    const ttl = resetPassword.getTokenTtl() ?? 0;
    const nowSeconds = Math.floor(this.clock.now().getTime() / 1000);

    if (ttl <= 0 || ttl <= nowSeconds) {
      return { isValid: false };
    }

    if (resetPassword.getToken() !== rawToken) {
      return { isValid: false };
    }

    return { isValid: true };
  }
}
