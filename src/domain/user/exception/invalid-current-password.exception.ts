import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidCurrentPasswordException extends UserDomainException {
  public constructor() {
    super("The current password is invalid.");
  }
}
