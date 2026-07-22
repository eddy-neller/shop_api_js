import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidUsernameException extends UserDomainException {
  public static empty(): InvalidUsernameException {
    return new InvalidUsernameException("Username cannot be empty.");
  }

  public static tooShort(min: number): InvalidUsernameException {
    return new InvalidUsernameException(
      `Username must contain at least ${min} characters.`,
    );
  }

  public static tooLong(max: number): InvalidUsernameException {
    return new InvalidUsernameException(
      `Username cannot exceed ${max} characters.`,
    );
  }
}
