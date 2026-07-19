import { Uuid } from '@/domain/shared/value-object/uuid';

export class RefreshTokenId {
  private constructor(private readonly value: Uuid) {}

  public static fromString(value: string): RefreshTokenId {
    return new RefreshTokenId(Uuid.fromString(value, 'refresh token id'));
  }

  public toString(): string {
    return this.value.toString();
  }
}
