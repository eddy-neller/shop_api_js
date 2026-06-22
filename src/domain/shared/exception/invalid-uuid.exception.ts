import { DomainException } from '@/domain/shared/exception/domain-exception';

export class InvalidUuidException extends DomainException {
  public constructor(name: string, value: string) {
    super(`Invalid ${name}: ${value}`);
  }
}
