import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const PASSWORD_PATTERN = /^(?=.*[()!@#$%^&*_-])(?=.*\d)(?=.*[A-Z]).{8,30}$/;

export class RegisterUserRequest {
  @IsEmail()
  public email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  public username!: string;

  @IsString()
  @Matches(PASSWORD_PATTERN)
  public password!: string;

  @IsObject()
  @IsOptional()
  public preferences?: {
    lang?: string;
  };
}
