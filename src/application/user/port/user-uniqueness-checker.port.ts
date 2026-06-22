import type { Email } from "@/domain/user/value-object/email";
import type { Username } from "@/domain/user/value-object/username";

export const USER_UNIQUENESS_CHECKER = Symbol("USER_UNIQUENESS_CHECKER");

export interface UserUniquenessCheckerPort {
  ensureEmailAndUsernameAvailable(
    email: Email,
    username: Username,
  ): Promise<void>;
}
