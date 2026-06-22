import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class ActivationLimitReachedException extends UserDomainException {
  public constructor() {
    super("Maximum number of activation emails reached.");
  }
}
