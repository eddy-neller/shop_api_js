import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { describe, expect, it } from "vitest";
import type { AccessTokenProviderPort } from "@/application/auth/port/access-token-provider.port";
import { InvalidCredentialsException } from "@/domain/user/exception/security/invalid-credentials.exception";
import type { AuthenticatedUser } from "@/presentation/http/shared/auth/authenticated-user";
import { JwtAuthGuard } from "@/presentation/http/shared/guard/jwt-auth.guard";

const accessTokens: AccessTokenProviderPort = {
  issue: () => ({ token: "t", expiresIn: 1 }),
  verify: (token) => {
    if (token === "valid") {
      return {
        sub: "id",
        email: "john@example.com",
        username: "john",
        roles: ["ROLE_USER"],
      };
    }

    throw new InvalidCredentialsException();
  },
};

function makeReflector(isPublic: boolean): Reflector {
  return { getAllAndOverride: () => isPublic } as unknown as Reflector;
}

function makeContext(headers: Record<string, string | undefined>): {
  context: ExecutionContext;
  request: Request & { user?: AuthenticatedUser };
} {
  const request = { headers } as unknown as Request & {
    user?: AuthenticatedUser;
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;

  return { context, request };
}

describe("JwtAuthGuard", () => {
  it("allows a public route without a token", () => {
    const guard = new JwtAuthGuard(makeReflector(true), accessTokens);

    expect(guard.canActivate(makeContext({}).context)).toBe(true);
  });

  it("rejects a protected route without a bearer token", () => {
    const guard = new JwtAuthGuard(makeReflector(false), accessTokens);

    expect(() => guard.canActivate(makeContext({}).context)).toThrow(
      UnauthorizedException,
    );
  });

  it("attaches the principal for a valid token", () => {
    const guard = new JwtAuthGuard(makeReflector(false), accessTokens);
    const { context, request } = makeContext({ authorization: "Bearer valid" });

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual({
      id: "id",
      email: "john@example.com",
      username: "john",
      roles: ["ROLE_USER"],
    });
  });

  it("rejects an invalid token", () => {
    const guard = new JwtAuthGuard(makeReflector(false), accessTokens);

    expect(() =>
      guard.canActivate(makeContext({ authorization: "Bearer bad" }).context),
    ).toThrow(UnauthorizedException);
  });
});
