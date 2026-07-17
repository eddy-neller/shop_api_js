import { afterEach, describe, expect, it, vi } from "vitest";
import { EnvConfig } from "@/infrastructure/service/config/env-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("EnvConfig", () => {
  it("returns centralized defaults when the environment value is absent", () => {
    vi.stubEnv("REGISTER_TOKEN_TTL", "");
    vi.stubEnv("RESET_PASSWORD_TOKEN_TTL", "");
    vi.stubEnv("JWT_ACCESS_TTL", "");
    vi.stubEnv("JWT_REFRESH_TTL", "");
    vi.stubEnv("MAX_LOGIN_ATTEMPTS", "");
    const config = new EnvConfig();

    expect(config.getString("REGISTER_TOKEN_TTL")).toBe("P2D");
    expect(config.getString("RESET_PASSWORD_TOKEN_TTL")).toBe("PT15M");
    expect(config.getString("JWT_ACCESS_TTL")).toBe("PT15M");
    expect(config.getString("JWT_REFRESH_TTL")).toBe("P30D");
    expect(config.getNumber("MAX_LOGIN_ATTEMPTS")).toBe(5);
  });

  it("uses the environment value when it is defined", () => {
    vi.stubEnv("JWT_REFRESH_TTL", "P7D");
    vi.stubEnv("MAX_LOGIN_ATTEMPTS", "3");
    const config = new EnvConfig();

    expect(config.getString("JWT_REFRESH_TTL")).toBe("P7D");
    expect(config.getNumber("MAX_LOGIN_ATTEMPTS")).toBe(3);
  });

  it("rejects an unknown setting without a default value", () => {
    const config = new EnvConfig();

    expect(() => config.getString("UNKNOWN_SETTING")).toThrow(
      "UNKNOWN_SETTING must be defined.",
    );
  });
});
