import { InvalidPasswordHashException } from '@/domain/user/exception/security/invalid-password-hash.exception';

export class PasswordHash {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): PasswordHash {
    if (value.trim() === '') {
      throw new InvalidPasswordHashException();
    }

    return new PasswordHash(value);
  }

  public toString(): string {
    return this.value;
  }
}

