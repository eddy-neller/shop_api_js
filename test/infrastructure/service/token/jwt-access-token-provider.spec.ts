import { JwtService } from "@nestjs/jwt";
import { describe, expect, it } from "vitest";
import type { ConfigPort } from "@/application/shared/port/config.port";
import { InvalidCredentialsException } from "@/domain/user/exception/security/invalid-credentials.exception";
import { JwtAccessTokenProvider } from "@/infrastructure/service/token/jwt-access-token-provider";

function makeConfig(secret = "test-secret"): ConfigPort {
  return {
    getString: (name, def) => {
      if (name === "JWT_SECRET") {
        return secret;
      }

      if (name === "JWT_ACCESS_TTL") {
        return "PT15M";
      }

      return def;
    },
    getNumber: (_name, def) => def,
  };
}

const claims = {
  sub: "11111111-1111-4111-8111-111111111111",
  email: "john@example.com",
  username: "john",
  roles: ["ROLE_USER"],
};

describe("JwtAccessTokenProvider", () => {
  it("issues a token that verifies back to the same claims", () => {
    const provider = new JwtAccessTokenProvider(new JwtService(), makeConfig());

    const issued = provider.issue(claims);
    expect(issued.expiresIn).toBe(900);
    expect(provider.verify(issued.token)).toEqual(claims);
  });

  it("rejects a malformed token", () => {
    const provider = new JwtAccessTokenProvider(new JwtService(), makeConfig());

    expect(() => provider.verify("not-a-jwt")).toThrow(
      InvalidCredentialsException,
    );
  });

  it("rejects a token signed with another secret", () => {
    const issuer = new JwtAccessTokenProvider(
      new JwtService(),
      makeConfig("secret-a"),
    );
    const verifier = new JwtAccessTokenProvider(
      new JwtService(),
      makeConfig("secret-b"),
    );

    const issued = issuer.issue(claims);

    expect(() => verifier.verify(issued.token)).toThrow(
      InvalidCredentialsException,
    );
  });
});
