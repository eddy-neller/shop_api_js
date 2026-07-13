import { describe, expect, it } from "vitest";
import { InvalidRoleException } from "@/domain/user/exception/access/invalid-role.exception";
import { UserRole, toUserRole } from "@/domain/user/value-object/access/user-role";

describe("toUserRole", () => {
  it.each([
    [UserRole.User],
    [UserRole.Moderator],
    [UserRole.Admin],
  ])("accepts the assignable role %s", (role) => {
    expect(toUserRole(role)).toBe(role);
  });

  it("rejects an unknown role", () => {
    expect(() => toUserRole("ROLE_UNKNOWN")).toThrow(InvalidRoleException);
  });

  it("rejects ROLE_SUPER_ADMIN as not assignable", () => {
    expect(() => toUserRole(UserRole.SuperAdmin)).toThrow(InvalidRoleException);
  });
});
