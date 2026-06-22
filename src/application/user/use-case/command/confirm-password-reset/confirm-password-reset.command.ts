export class ConfirmPasswordResetCommand {
  public constructor(
    public readonly token: string,
    public readonly newPassword: string,
  ) {}
}
