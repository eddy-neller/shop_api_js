import { IsEmail } from "class-validator";

export class RequestPasswordResetRequest {
  @IsEmail()
  public email!: string;
}
