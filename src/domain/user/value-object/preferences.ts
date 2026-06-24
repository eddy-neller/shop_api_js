import { InvalidPreferencesException } from "@/domain/user/exception/invalid-preferences.exception";

export const SUPPORTED_LANGS = ["en", "fr"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: Lang = "en";

export type PreferencesSnapshot = {
  lang: string;
};

export class Preferences {
  public constructor(private readonly lang: string = DEFAULT_LANG) {
    Preferences.ensureSupportedLang(lang);
  }

  public static fromObject(value: Record<string, unknown>): Preferences {
    return new Preferences(
      typeof value.lang === "string" ? value.lang : DEFAULT_LANG,
    );
  }

  public toObject(): PreferencesSnapshot {
    return {
      lang: this.lang,
    };
  }

  private static ensureSupportedLang(lang: string): void {
    const allowed = SUPPORTED_LANGS as readonly string[];

    if (!allowed.includes(lang)) {
      throw InvalidPreferencesException.unsupportedLang(lang);
    }
  }
}
