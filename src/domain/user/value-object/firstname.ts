import { InvalidFirstnameException } from "@/domain/user/exception/invalid-firstname.exception";

const MIN_LENGTH = 2;
const MAX_LENGTH = 50;

export class Firstname {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): Firstname {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw InvalidFirstnameException.empty();
    }

    if (trimmed.length < MIN_LENGTH) {
      throw InvalidFirstnameException.tooShort(MIN_LENGTH);
    }

    if (trimmed.length > MAX_LENGTH) {
      throw InvalidFirstnameException.tooLong(MAX_LENGTH);
    }

    return new Firstname(trimmed);
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: Firstname): boolean {
    return this.value === other.value;
  }
}
