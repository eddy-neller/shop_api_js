import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { RegisterPreferencesRequest } from "@/presentation/http/onboarding/dto/register-preferences.request";
import { IsPassword } from "@/presentation/http/shared/validation/is-password.decorator";

export class RegisterUserRequest {
  @IsEmail()
  public email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  public username!: string;

  @IsPassword()
  public password!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterPreferencesRequest)
  public preferences?: RegisterPreferencesRequest;
}
