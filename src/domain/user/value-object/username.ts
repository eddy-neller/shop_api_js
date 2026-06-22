import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

const MIN_LENGTH = 2;
const MAX_LENGTH = 20;

export class Username {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): Username {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new UserDomainException("Username cannot be empty.");
    }

    if (trimmed.length < MIN_LENGTH) {
      throw new UserDomainException(
        `Username must contain at least ${MIN_LENGTH} characters.`,
      );
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new UserDomainException(
        `Username cannot exceed ${MAX_LENGTH} characters.`,
      );
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
