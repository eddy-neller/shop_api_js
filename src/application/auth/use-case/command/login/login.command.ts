export class LoginCommand {
  public constructor(
    public readonly email: string,
    public readonly plainPassword: string,
  ) {}
}
