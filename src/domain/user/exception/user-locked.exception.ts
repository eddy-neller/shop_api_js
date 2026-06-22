import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class UserLockedException extends UserDomainException {
  public constructor() {
    super("The account is locked.");
  }
}
