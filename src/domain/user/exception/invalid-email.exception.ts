import { UserDomainException } from '@/domain/user/exception/user-domain-exception';

export class InvalidEmailException extends UserDomainException {
  public constructor(email: string) {
    super(`Invalid email: ${email}`);
  }
}
