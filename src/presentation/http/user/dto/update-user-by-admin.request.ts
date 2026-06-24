import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { IsPassword } from "@/presentation/http/shared/validation/is-password.decorator";

export class UpdateUserByAdminRequest {
  @IsOptional()
  @IsEmail()
  public email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  public username?: string;

  @IsOptional()
  @IsPassword()
  public plainPassword?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public roles?: string[];

  @IsOptional()
  @IsInt()
  public status?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  public firstname?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  public lastname?: string;
}
