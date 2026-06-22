export type ActiveEmailSnapshot = {
  mailSent: number;
  token: string | null;
  tokenTtl: number | null;
  lastAttempt: string | null;
};

export class ActiveEmail {
  public constructor(
    private readonly mailSent = 0,
    private readonly token: string | null = null,
    private readonly tokenTtl: number | null = null,
    private readonly lastAttempt: Date | null = null,
  ) {}

  public static fromObject(value: Record<string, unknown>): ActiveEmail {
    return new ActiveEmail(
      Number(value.mailSent ?? 0),
      typeof value.token === "string" ? value.token : null,
      typeof value.tokenTtl === "number" ? value.tokenTtl : null,
      ActiveEmail.parseDate(value.lastAttempt),
    );
  }

  public toObject(): ActiveEmailSnapshot {
    return {
      mailSent: this.mailSent,
      token: this.token,
      tokenTtl: this.tokenTtl,
      lastAttempt: this.lastAttempt?.toISOString() ?? null,
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

  private static parseDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== "string" || value.trim() === "") {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }
}
