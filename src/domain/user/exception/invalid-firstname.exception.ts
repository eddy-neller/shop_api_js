import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidFirstnameException extends UserDomainException {
  public static empty(): InvalidFirstnameException {
    return new InvalidFirstnameException("Firstname cannot be empty.");
  }

  public static tooShort(minLength: number): InvalidFirstnameException {
    return new InvalidFirstnameException(
      `Firstname must contain at least ${minLength} characters.`,
    );
  }

  public static tooLong(maxLength: number): InvalidFirstnameException {
    return new InvalidFirstnameException(
      `Firstname cannot exceed ${maxLength} characters.`,
    );
  }
}
