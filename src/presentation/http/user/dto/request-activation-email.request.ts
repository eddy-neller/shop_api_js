import { IsEmail } from "class-validator";

export class RequestActivationEmailRequest {
  @IsEmail()
  public email!: string;
}
