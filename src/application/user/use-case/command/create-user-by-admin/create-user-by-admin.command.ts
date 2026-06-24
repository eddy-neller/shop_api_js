export class CreateUserByAdminCommand {
  public constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly plainPassword: string,
    public readonly roles: string[],
    public readonly status: number,
    public readonly firstname: string | null = null,
    public readonly lastname: string | null = null,
  ) {}
}
