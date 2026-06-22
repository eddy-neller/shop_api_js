import { DomainException } from "@/domain/shared/exception/domain-exception";

export class UserDomainException extends DomainException {
  public constructor(message: string) {
    super(message);
  }
}
