import { InvalidPreferencesException } from "@/domain/user/exception/profile/invalid-preferences.exception";

export const SUPPORTED_LANGS = ["en", "fr"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: Lang = "en";

export type PreferencesSnapshot = {
  lang: string;
};

export class Preferences {
  private readonly lang: Lang;

  private constructor(lang: string = DEFAULT_LANG) {
    this.lang = Preferences.normalizeLang(lang);
  }

  public static create(lang: string = DEFAULT_LANG): Preferences {
    return new Preferences(lang);
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

  private static normalizeLang(lang: string): Lang {
    const normalized = lang.toLowerCase();
    const allowed = SUPPORTED_LANGS as readonly string[];

    if (!allowed.includes(normalized)) {
      throw InvalidPreferencesException.unsupportedLang(lang);
    }

    return normalized as Lang;
  }
}
