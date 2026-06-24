export class UpdateUserByAdminCommand {
  public constructor(
    public readonly userId: string,
    public readonly email: string | null = null,
    public readonly username: string | null = null,
    public readonly plainPassword: string | null = null,
    public readonly roles: string[] | null = null,
    public readonly status: number | null = null,
    public readonly firstname: string | null = null,
    public readonly lastname: string | null = null,
  ) {}
}
