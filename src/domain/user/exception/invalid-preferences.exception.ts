import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidPreferencesException extends UserDomainException {
  public static unsupportedLang(lang: string): InvalidPreferencesException {
    return new InvalidPreferencesException(`Unsupported language: ${lang}.`);
  }
}
