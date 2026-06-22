import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class EmailAlreadyUsedException extends UserDomainException {
  public constructor(message = "Email address is already used.") {
    super(message);
  }
}
