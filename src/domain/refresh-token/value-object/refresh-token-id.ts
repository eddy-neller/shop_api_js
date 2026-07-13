import { InvalidUuidException } from "@/domain/shared/exception/invalid-uuid.exception";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class RefreshTokenId {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): RefreshTokenId {
    if (!UUID_REGEX.test(value)) {
      throw new InvalidUuidException("refresh token id", value);
    }

    return new RefreshTokenId(value);
  }

  public toString(): string {
    return this.value;
  }
}
