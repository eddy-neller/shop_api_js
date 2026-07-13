import { IsString, MinLength } from "class-validator";

export class LogoutRequest {
  @IsString()
  @MinLength(1)
  public refreshToken!: string;
}
