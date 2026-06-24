import { InvalidUserStatusException } from '@/domain/user/exception/invalid-user-status.exception';

export class UserStatus {
  public static readonly Inactive = 0;
  public static readonly Active = 1;
  public static readonly Blocked = 2;

  private constructor(private readonly value: number) {}

  public static inactive(): UserStatus {
    return new UserStatus(UserStatus.Inactive);
  }

  public static active(): UserStatus {
    return new UserStatus(UserStatus.Active);
  }

  public static blocked(): UserStatus {
    return new UserStatus(UserStatus.Blocked);
  }

  public static fromNumber(value: number): UserStatus {
    const allowed = [
      UserStatus.Inactive,
      UserStatus.Active,
      UserStatus.Blocked
    ];

    if (!allowed.includes(value)) {
      throw InvalidUserStatusException.unsupported(value);
    }

    return new UserStatus(value);
  }

  public toNumber(): number {
    return this.value;
  }

  public isActive(): boolean {
    return this.value === UserStatus.Active;
  }

  public isBlocked(): boolean {
    return this.value === UserStatus.Blocked;
  }
}
