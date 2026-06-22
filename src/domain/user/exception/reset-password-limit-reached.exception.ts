import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class ResetPasswordLimitReachedException extends UserDomainException {
  public constructor() {
    super("Maximum number of password reset emails reached.");
  }
}
