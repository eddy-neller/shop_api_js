export type ResetPasswordSnapshot = {
  mailSent: number;
  token: string | null;
  tokenTtl: number | null;
};

export class ResetPassword {
  public constructor(
    private readonly mailSent = 0,
    private readonly token: string | null = null,
    private readonly tokenTtl: number | null = null,
  ) {}

  public static fromObject(value: Record<string, unknown>): ResetPassword {
    return new ResetPassword(
      Number(value.mailSent ?? 0),
      typeof value.token === "string" ? value.token : null,
      typeof value.tokenTtl === "number" ? value.tokenTtl : null,
    );
  }

  public toObject(): ResetPasswordSnapshot {
    return {
      mailSent: this.mailSent,
      token: this.token,
      tokenTtl: this.tokenTtl,
    };
  }

  public getMailSent(): number {
    return this.mailSent;
  }

  public getToken(): string | null {
    return this.token;
  }

  public getTokenTtl(): number | null {
    return this.tokenTtl;
  }
}
