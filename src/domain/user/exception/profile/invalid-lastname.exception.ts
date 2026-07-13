import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidLastnameException extends UserDomainException {
  public static empty(): InvalidLastnameException {
    return new InvalidLastnameException("Lastname cannot be empty.");
  }

  public static tooShort(minLength: number): InvalidLastnameException {
    return new InvalidLastnameException(
      `Lastname must contain at least ${minLength} characters.`,
    );
  }

  public static tooLong(maxLength: number): InvalidLastnameException {
    return new InvalidLastnameException(
      `Lastname cannot exceed ${maxLength} characters.`,
    );
  }
}
