import { InvalidUuidException } from '@/domain/shared/exception/invalid-uuid.exception';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class Uuid {
  private constructor(private readonly value: string) {}

  public static fromString(value: string, label = 'Uuid'): Uuid {
    if (!UUID_REGEX.test(value)) {
      throw new InvalidUuidException(label, value);
    }

    return new Uuid(value);
  }

  public equals(other: Uuid): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
