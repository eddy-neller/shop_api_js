import type { ClockPort } from "@/application/shared/port/clock.port";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { AuthTokensReadModel } from "@/application/auth/dto/auth-tokens.read-model";
import type { AuthTokenIssuerPort } from "@/application/auth/port/auth-token-issuer.port";
import type { PasswordHasherPort } from "@/application/shared/port/password-hasher.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import type { LoginCommand } from "@/application/auth/use-case/command/login/login.command";
import { AccountNotActivatedException } from "@/domain/user/exception/lifecycle/account-not-activated.exception";
import { InvalidCredentialsException } from "@/domain/user/exception/security/invalid-credentials.exception";
import { UserLockedException } from "@/domain/user/exception/security/user-locked.exception";
import { Email } from "@/domain/user/value-object/identity/email";

export class LoginUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenIssuer: AuthTokenIssuerPort,
    private readonly clock: ClockPort,
    private readonly config: ConfigPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(command: LoginCommand): Promise<AuthTokensReadModel> {
    const email = Email.fromString(command.email);
    const now = this.clock.now();
    const maxAttempts = this.config.getNumber("MAX_LOGIN_ATTEMPTS");

    return this.transactional.execute(async () => {
      const user = await this.users.findByEmail(email);

      if (user === null) {
        throw new InvalidCredentialsException();
      }

      if (user.isLocked()) {
        throw new UserLockedException();
      }

      const passwordValid = await this.passwordHasher.verify(
        user.getPasswordHash().toString(),
        command.plainPassword,
      );

      if (!passwordValid) {
        user.registerWrongPasswordAttempt(maxAttempts, now);
        await this.users.save(user);

        if (user.isLocked()) {
          throw new UserLockedException();
        }

        throw new InvalidCredentialsException();
      }

      if (!user.isActive()) {
        throw new AccountNotActivatedException();
      }

      user.resetWrongPasswordAttempts(now);
      user.recordSuccessfulLogin(now);
      await this.users.save(user);

      return this.tokenIssuer.issue(user, now);
    });
  }
}
