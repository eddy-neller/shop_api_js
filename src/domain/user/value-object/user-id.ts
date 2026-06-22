import { InvalidUuidException } from '@/domain/shared/exception/invalid-uuid.exception';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class UserId {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): UserId {
    if (!UUID_REGEX.test(value)) {
      throw new InvalidUuidException('user id', value);
    }

    return new UserId(value);
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
