import type {
  CorsOptions,
  CustomOrigin,
} from "@nestjs/common/interfaces/external/cors-options.interface";
import { describe, expect, it } from "vitest";
import {
  createCorsOptions,
  parseCorsOriginRegex,
} from "@/infrastructure/nest/cors/cors-options";

function getOriginValidator(options: CorsOptions): CustomOrigin {
  if (typeof options.origin !== "function") {
    throw new Error("CORS origin validator must be a function.");
  }

  return options.origin;
}

describe("parseCorsOriginRegex", () => {
  it("rejects an absent variable", () => {
    expect(() => parseCorsOriginRegex(undefined)).toThrow(
      "CORS_ORIGIN_REGEX must be defined.",
    );
  });

  it("rejects an invalid regular expression", () => {
    expect(() => parseCorsOriginRegex("[")).toThrow(
      "CORS_ORIGIN_REGEX must be a valid regular expression.",
    );
  });

  it("parses a regular expression", () => {
    expect(
      parseCorsOriginRegex(
        "^https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?$",
      ).test("http://127.0.0.1:5173"),
    ).toBe(true);
  });
});

describe("createCorsOptions", () => {
  const validator = getOriginValidator(
    createCorsOptions(parseCorsOriginRegex("^https://app\\.example\\.com$")),
  );

  it("allows an origin matching the regular expression", () => {
    validator("https://app.example.com", (error, allow) => {
      expect(error).toBeNull();
      expect(allow).toBe(true);
    });
  });

  it("rejects an origin not matching the regular expression", () => {
    validator("https://untrusted.example.com", (error, allow) => {
      expect(error).toBeInstanceOf(Error);
      expect(allow).toBeUndefined();
    });
  });

  it("allows requests without an Origin header", () => {
    validator(undefined, (error, allow) => {
      expect(error).toBeNull();
      expect(allow).toBe(true);
    });
  });

  it("uses bearer-token CORS defaults", () => {
    const options = createCorsOptions(/.*/);

    expect(options.credentials).toBe(false);
    expect(options.methods).toEqual([
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ]);
    expect(options.allowedHeaders).toEqual([
      "Content-Type",
      "Authorization",
      "Accept",
      "Accept-Language",
    ]);
    expect(options.exposedHeaders).toEqual([
      "X-Total-Count",
      "X-Total-Pages",
    ]);
    expect(options.maxAge).toBe(3_600);
  });
});
