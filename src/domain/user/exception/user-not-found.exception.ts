import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class UserNotFoundException extends UserDomainException {
  public constructor(idOrMessage: string) {
    super(
      idOrMessage.includes(" ")
        ? idOrMessage
        : `User not found: ${idOrMessage}`,
    );
  }
}
