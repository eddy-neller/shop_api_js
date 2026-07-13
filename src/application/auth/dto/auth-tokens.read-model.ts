export class AuthTokensReadModel {
  public constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly tokenType: string,
    public readonly expiresIn: number,
  ) {}

  public static of(params: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }): AuthTokensReadModel {
    return new AuthTokensReadModel(
      params.accessToken,
      params.refreshToken,
      "Bearer",
      params.expiresIn,
    );
  }
}
