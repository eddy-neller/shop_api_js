import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidRefreshTokenException extends UserDomainException {
  public constructor() {
    super("The refresh token is invalid or has expired.");
  }
}
