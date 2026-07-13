import { IsString, MinLength } from "class-validator";
import { IsPassword } from "@/presentation/http/shared/validation/is-password.decorator";

export class UpdatePasswordRequest {
  @IsString()
  @MinLength(1)
  public currentPassword!: string;

  @IsPassword()
  public newPassword!: string;
}
