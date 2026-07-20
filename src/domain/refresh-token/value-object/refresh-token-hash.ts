export class RefreshTokenHash {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): RefreshTokenHash {
    if (value.trim() === "") {
      throw new Error("A refresh token hash cannot be empty.");
    }

    return new RefreshTokenHash(value);
  }

  public toString(): string {
    return this.value;
  }
}
