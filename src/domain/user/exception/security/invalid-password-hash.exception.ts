import { UserDomainException } from '@/domain/user/exception/user-domain-exception';

export class InvalidPasswordHashException extends UserDomainException {
  public constructor() {
    super('Password hash cannot be empty.');
  }
}
