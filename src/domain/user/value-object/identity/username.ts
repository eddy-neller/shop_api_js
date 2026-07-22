import { InvalidUsernameException } from "@/domain/user/exception/identity/invalid-username.exception";

const MIN_LENGTH = 2;
const MAX_LENGTH = 20;

export class Username {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): Username {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw InvalidUsernameException.empty();
    }

    if (trimmed.length < MIN_LENGTH) {
      throw InvalidUsernameException.tooShort(MIN_LENGTH);
    }

    if (trimmed.length > MAX_LENGTH) {
      throw InvalidUsernameException.tooLong(MAX_LENGTH);
    }

    return new Username(trimmed);
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: Username): boolean {
    return this.value === other.value;
  }
}
