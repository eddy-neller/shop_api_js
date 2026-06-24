import { IsString, MinLength } from "class-validator";
import { IsPassword } from "@/presentation/http/shared/validation/is-password.decorator";

export class ConfirmPasswordResetRequest {
  @IsString()
  @MinLength(1)
  public token!: string;

  @IsPassword()
  public newPassword!: string;
}
