export type PreferencesSnapshot = {
  lang: string;
};

export class Preferences {
  public constructor(private readonly lang = "fr") {}

  public static fromObject(value: Record<string, unknown>): Preferences {
    return new Preferences(typeof value.lang === "string" ? value.lang : "fr");
  }

  public toObject(): PreferencesSnapshot {
    return {
      lang: this.lang,
    };
  }
}
