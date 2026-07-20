export class PasswordHash {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): PasswordHash {
    if (value.trim() === '') {
      throw new Error('Password hash cannot be empty.');
    }

    return new PasswordHash(value);
  }

  public toString(): string {
    return this.value;
  }
}

