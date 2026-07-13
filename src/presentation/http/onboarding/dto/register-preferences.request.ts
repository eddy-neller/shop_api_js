import { IsString } from "class-validator";

/**
 * Preferences utilisateur fournies a l'inscription. Validee en nested via
 * `@ValidateNested` + `@Type`.
 */
export class RegisterPreferencesRequest {
  @IsString()
  public lang!: string;
}
