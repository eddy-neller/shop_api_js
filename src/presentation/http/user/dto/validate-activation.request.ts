import { IsString, MinLength } from "class-validator";

export class ValidateActivationRequest {
  @IsString()
  @MinLength(1)
  public token!: string;
}
