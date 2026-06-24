import { InvalidLastnameException } from "@/domain/user/exception/invalid-lastname.exception";

const MIN_LENGTH = 2;
const MAX_LENGTH = 50;

export class Lastname {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): Lastname {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw InvalidLastnameException.empty();
    }

    if (trimmed.length < MIN_LENGTH) {
      throw InvalidLastnameException.tooShort(MIN_LENGTH);
    }

    if (trimmed.length > MAX_LENGTH) {
      throw InvalidLastnameException.tooLong(MAX_LENGTH);
    }

    return new Lastname(trimmed);
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: Lastname): boolean {
    return this.value === other.value;
  }
}
