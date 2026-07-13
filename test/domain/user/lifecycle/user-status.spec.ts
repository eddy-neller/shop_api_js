import { describe, expect, it } from "vitest";
import { InvalidUserStatusException } from "@/domain/user/exception/lifecycle/invalid-user-status.exception";
import { UserStatus } from "@/domain/user/value-object/lifecycle/user-status";

describe("UserStatus value object", () => {
  it.each([
    [UserStatus.Inactive],
    [UserStatus.Active],
    [UserStatus.Blocked],
  ])("accepts the allowed status %i", (value) => {
    expect(UserStatus.fromNumber(value).toNumber()).toBe(value);
  });

  it.each([[-1], [3], [99]])("rejects the out-of-range status %i", (value) => {
    expect(() => UserStatus.fromNumber(value)).toThrow(
      InvalidUserStatusException,
    );
  });
});
