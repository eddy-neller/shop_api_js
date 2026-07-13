export class LogoutCommand {
  public constructor(
    public readonly userId: string,
    public readonly refreshToken: string,
  ) {}
}
