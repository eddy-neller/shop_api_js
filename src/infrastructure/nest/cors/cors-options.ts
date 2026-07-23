import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

const ALLOWED_METHODS: string[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
];

const ALLOWED_HEADERS: string[] = ["Content-Type", "Authorization", "Accept", "Accept-Language"];

const EXPOSED_HEADERS: string[] = ["X-Total-Count", "X-Total-Pages"];

const PREFLIGHT_MAX_AGE_SECONDS = 3_600;

export function parseCorsOriginRegex(value: string | undefined): RegExp {
  if (value === undefined || value.trim() === "") {
    throw new Error("CORS_ORIGIN_REGEX must be defined.");
  }

  try {
    return new RegExp(value);
  } catch {
    throw new Error("CORS_ORIGIN_REGEX must be a valid regular expression.");
  }
}

export function createCorsOptions(
  allowedOrigin: RegExp,
): CorsOptions {
  return {
    origin: (origin, callback) => {
      if (origin === undefined || allowedOrigin.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: false,
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
  };
}
