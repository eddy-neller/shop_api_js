import { InvalidRefreshTokenHashException } from "@/domain/refresh-token/exception/invalid-refresh-token-hash.exception";

export class RefreshTokenHash {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): RefreshTokenHash {
    if (value.trim() === "") {
      throw new InvalidRefreshTokenHashException();
    }

    return new RefreshTokenHash(value);
  }

  public toString(): string {
    return this.value;
  }
}
