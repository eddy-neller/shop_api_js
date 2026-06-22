import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class UsernameAlreadyUsedException extends UserDomainException {
  public constructor(message = "Username is already used.") {
    super(message);
  }
}
