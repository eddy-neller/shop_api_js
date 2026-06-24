import { applyDecorators } from "@nestjs/common";
import { IsString, Matches } from "class-validator";

/**
 * Politique de mot de passe partagee par toutes les requetes HTTP exposant un
 * mot de passe en clair: 8 a 30 caracteres, au moins une majuscule, un chiffre
 * et un caractere special parmi `()!@#$%^&*_-`.
 */
const PASSWORD_PATTERN = /^(?=.*[()!@#$%^&*_-])(?=.*\d)(?=.*[A-Z]).{8,30}$/;

/**
 * Decorateur de validation reutilisable pour un champ mot de passe en clair.
 * Composer avec `@IsOptional()` quand le champ est facultatif.
 */
export function IsPassword(): PropertyDecorator {
  return applyDecorators(IsString(), Matches(PASSWORD_PATTERN));
}
