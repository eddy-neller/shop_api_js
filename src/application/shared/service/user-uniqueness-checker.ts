import type { UserUniquenessCheckerPort } from "@/application/shared/port/user-uniqueness-checker.port";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { EmailAlreadyUsedException } from "@/domain/user/exception/uniqueness/email-already-used.exception";
import { UsernameAlreadyUsedException } from "@/domain/user/exception/uniqueness/username-already-used.exception";
import type { Email } from "@/domain/user/value-object/identity/email";
import type { UserId } from "@/domain/user/value-object/identity/user-id";
import type { Username } from "@/domain/user/value-object/identity/username";

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

  public async ensureEmailAvailable(
    email: Email,
    excludeUserId?: UserId,
  ): Promise<void> {
    const existing = await this.users.findByEmail(email);

    if (existing === null) {
      return;
    }

    if (
      excludeUserId !== undefined &&
      existing.getId().equals(excludeUserId)
    ) {
      return;
    }

    throw new EmailAlreadyUsedException();
  }

  public async ensureUsernameAvailable(
    username: Username,
    excludeUserId?: UserId,
  ): Promise<void> {
    const existing = await this.users.findByUsername(username);

    if (existing === null) {
      return;
    }

    if (
      excludeUserId !== undefined &&
      existing.getId().equals(excludeUserId)
    ) {
      return;
    }

    throw new UsernameAlreadyUsedException();
  }
}
