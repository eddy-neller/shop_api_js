import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidUserStatusException extends UserDomainException {
  public static unsupported(value: number): InvalidUserStatusException {
    return new InvalidUserStatusException(`Unsupported status: ${value}.`);
  }
}
