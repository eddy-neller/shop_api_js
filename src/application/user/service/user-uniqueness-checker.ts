import type { UserUniquenessCheckerPort } from "@/application/user/port/user-uniqueness-checker.port";
import type { UserRepositoryPort } from "@/application/user/port/user-repository.port";
import { EmailAlreadyUsedException } from "@/domain/user/exception/uniqueness/email-already-used.exception";
import { UsernameAlreadyUsedException } from "@/domain/user/exception/uniqueness/username-already-used.exception";
import type { Email } from "@/domain/user/value-object/email";
import type { Username } from "@/domain/user/value-object/username";

export class UserUniquenessChecker implements UserUniquenessCheckerPort {
  public constructor(private readonly users: UserRepositoryPort) {}

  public async ensureEmailAndUsernameAvailable(
    email: Email,
    username: Username,
  ): Promise<void> {
    const existingEmail = await this.users.findByEmail(email);
    if (existingEmail !== null) {
      throw new EmailAlreadyUsedException();
    }

    const existingUsername = await this.users.findByUsername(username);
    if (existingUsername !== null) {
      throw new UsernameAlreadyUsedException();
    }
  }
}
