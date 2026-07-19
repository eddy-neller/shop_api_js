import { Uuid } from '@/domain/shared/value-object/uuid';

export class UserId {
  private constructor(private readonly value: Uuid) {}

  public static fromString(value: string): UserId {
    return new UserId(Uuid.fromString(value, 'user id'));
  }

  public toString(): string {
    return this.value.toString();
  }

  public equals(other: UserId): boolean {
    return this.value.equals(other.value);
  }
}
