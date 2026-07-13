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

export class CreateUserByAdminRequest {
  @IsEmail()
  public email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  public username!: string;

  @IsPassword()
  public plainPassword!: string;

  @IsArray()
  @IsString({ each: true })
  public roles!: string[];

  @IsInt()
  public status!: number;

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
