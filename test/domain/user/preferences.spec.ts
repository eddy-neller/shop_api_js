import { describe, expect, it } from "vitest";
import { InvalidPreferencesException } from "@/domain/user/exception/invalid-preferences.exception";
import { Preferences } from "@/domain/user/value-object/preferences";

describe("Preferences value object", () => {
  it("defaults to the en language", () => {
    expect(new Preferences().toObject()).toEqual({ lang: "en" });
  });

  it.each([["en"], ["fr"]])("accepts the supported lang %s", (lang) => {
    expect(new Preferences(lang).toObject().lang).toBe(lang);
  });

  it.each([["de"], ["fra"], [""]])(
    "rejects the unsupported lang %s",
    (lang) => {
      expect(() => new Preferences(lang)).toThrow(InvalidPreferencesException);
    },
  );

  it("rejects an unsupported lang coming from a raw object", () => {
    expect(() => Preferences.fromObject({ lang: "de" })).toThrow(
      InvalidPreferencesException,
    );
  });

  it("falls back to en when lang is missing from a raw object", () => {
    expect(Preferences.fromObject({}).toObject()).toEqual({ lang: "en" });
  });
});
