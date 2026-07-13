import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class AccountNotActivatedException extends UserDomainException {
  public constructor() {
    super("The account is not activated.");
  }
}
