import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidRoleException extends UserDomainException {
  public static unknown(role: string): InvalidRoleException {
    return new InvalidRoleException(`Invalid role: ${role}.`);
  }

  public static notAssignable(role: string): InvalidRoleException {
    return new InvalidRoleException(`Role ${role} cannot be assigned.`);
  }
}
