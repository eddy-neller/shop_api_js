export type SecuritySnapshot = {
  totalWrongPassword: number;
  totalWrongTwoFactorCode: number;
  totalTwoFactorSmsSent: number;
};

export class Security {
  private constructor(
    private readonly totalWrongPassword = 0,
    private readonly totalWrongTwoFactorCode = 0,
    private readonly totalTwoFactorSmsSent = 0,
  ) {}

  public static create(
    totalWrongPassword = 0,
    totalWrongTwoFactorCode = 0,
    totalTwoFactorSmsSent = 0,
  ): Security {
    return new Security(
      totalWrongPassword,
      totalWrongTwoFactorCode,
      totalTwoFactorSmsSent,
    );
  }

  public static fromObject(value: Record<string, unknown>): Security {
    return new Security(
      Number(value.totalWrongPassword ?? 0),
      Number(value.totalWrongTwoFactorCode ?? 0),
      Number(value.totalTwoFactorSmsSent ?? 0),
    );
  }

  public toObject(): SecuritySnapshot {
    return {
      totalWrongPassword: this.totalWrongPassword,
      totalWrongTwoFactorCode: this.totalWrongTwoFactorCode,
      totalTwoFactorSmsSent: this.totalTwoFactorSmsSent,
    };
  }

  public getTotalWrongPassword(): number {
    return this.totalWrongPassword;
  }

  public withTotalWrongPassword(totalWrongPassword: number): Security {
    return new Security(
      totalWrongPassword,
      this.totalWrongTwoFactorCode,
      this.totalTwoFactorSmsSent,
    );
  }
}
