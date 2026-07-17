import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { ConfirmPasswordResetCommand } from "@/application/account/use-case/command/confirm-password-reset/confirm-password-reset.command";
import type { PasswordHasherPort } from "@/application/shared/port/password-hasher.port";
import type { TokenProviderPort } from "@/application/shared/port/token-provider.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { UserDomainException } from "@/domain/user/exception/user-domain-exception";
import { Email } from "@/domain/user/value-object/identity/email";
import { PasswordHash } from "@/domain/user/value-object/security/password-hash";

export class ConfirmPasswordResetUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(command: ConfirmPasswordResetCommand): Promise<void> {
    const split = this.tokenProvider.split(command.token);
    const email = Email.fromString(split.email ?? "");
    const rawToken = split.token ?? "";
    const user = await this.users.findByResetPasswordToken(rawToken);

    if (user === null || !user.getEmail().equals(email)) {
      throw new UserDomainException("Password reset token is invalid.");
    }

    const passwordHash = PasswordHash.fromString(
      await this.passwordHasher.hash(command.newPassword),
    );

    await this.transactional.execute(async () => {
      user.completePasswordReset(rawToken, passwordHash, this.clock.now());

      await this.users.save(user);
    });
  }
}
