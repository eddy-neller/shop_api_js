import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidRefreshTokenHashException extends UserDomainException {
  public constructor() {
    super("A refresh token hash cannot be empty.");
  }
}
