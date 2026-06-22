import { IsString, Matches, MinLength } from "class-validator";

const PASSWORD_PATTERN = /^(?=.*[()!@#$%^&*_-])(?=.*\d)(?=.*[A-Z]).{8,30}$/;

export class ConfirmPasswordResetRequest {
  @IsString()
  @MinLength(1)
  public token!: string;

  @IsString()
  @Matches(PASSWORD_PATTERN)
  public newPassword!: string;
}
