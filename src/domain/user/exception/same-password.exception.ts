import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class SamePasswordException extends UserDomainException {
  public constructor() {
    super("The new password must be different from the current password.");
  }
}
