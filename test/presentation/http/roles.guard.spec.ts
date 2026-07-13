import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { UserRole } from "@/domain/user/value-object/access/user-role";
import type { AuthenticatedUser } from "@/presentation/http/shared/auth/authenticated-user";
import { RolesGuard } from "@/presentation/http/shared/guard/roles.guard";

function makeGuard(required: string[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: () => required,
  } as unknown as Reflector;

  return new RolesGuard(reflector);
}

function makeContext(user?: AuthenticatedUser): ExecutionContext {
  const request = { user };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function user(roles: string[]): AuthenticatedUser {
  return { id: "id", email: "john@example.com", username: "john", roles };
}

describe("RolesGuard", () => {
  it("allows a route without a role requirement", () => {
    expect(makeGuard(undefined).canActivate(makeContext())).toBe(true);
  });

  it("allows a user holding the required role", () => {
    expect(
      makeGuard([UserRole.Admin]).canActivate(makeContext(user([UserRole.Admin]))),
    ).toBe(true);
  });

  it("allows a higher role through the hierarchy", () => {
    expect(
      makeGuard([UserRole.Admin]).canActivate(
        makeContext(user([UserRole.SuperAdmin])),
      ),
    ).toBe(true);
  });

  it("rejects a user without the required role", () => {
    expect(() =>
      makeGuard([UserRole.Admin]).canActivate(makeContext(user([UserRole.User]))),
    ).toThrow(ForbiddenException);
  });

  it("rejects when there is no authenticated user", () => {
    expect(() =>
      makeGuard([UserRole.Admin]).canActivate(makeContext()),
    ).toThrow(ForbiddenException);
  });
});
