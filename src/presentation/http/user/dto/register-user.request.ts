import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { IsPassword } from "@/presentation/http/shared/validation/is-password.decorator";
import { RegisterPreferencesRequest } from "@/presentation/http/user/dto/register-preferences.request";

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
