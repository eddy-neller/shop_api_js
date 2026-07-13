import type { Email } from "@/domain/user/value-object/identity/email";
import type { UserId } from "@/domain/user/value-object/identity/user-id";
import type { Username } from "@/domain/user/value-object/identity/username";

export const USER_UNIQUENESS_CHECKER = Symbol("USER_UNIQUENESS_CHECKER");

export interface UserUniquenessCheckerPort {
  ensureEmailAndUsernameAvailable(
    email: Email,
    username: Username,
  ): Promise<void>;
  ensureEmailAvailable(
    email: Email,
    excludeUserId?: UserId,
  ): Promise<void>;
  ensureUsernameAvailable(
    username: Username,
    excludeUserId?: UserId,
  ): Promise<void>;
}
