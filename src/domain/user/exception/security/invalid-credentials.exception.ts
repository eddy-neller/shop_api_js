import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidCredentialsException extends UserDomainException {
  public constructor() {
    super("Invalid credentials.");
  }
}
