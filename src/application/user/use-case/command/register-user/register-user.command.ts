import type { PreferencesSnapshot } from "@/domain/user/value-object/preferences";

export class RegisterUserCommand {
  public constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly plainPassword: string,
    public readonly preferences: Partial<PreferencesSnapshot> | null = null,
  ) {}
}
