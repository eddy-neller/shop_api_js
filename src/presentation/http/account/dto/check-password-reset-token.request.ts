import { IsString, MinLength } from "class-validator";

export class CheckPasswordResetTokenRequest {
  @IsString()
  @MinLength(1)
  public token!: string;
}
