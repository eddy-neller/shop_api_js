import { describe, expect, it } from "vitest";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/identity/email";
import { PasswordHash } from "@/domain/user/value-object/security/password-hash";
import { Preferences } from "@/domain/user/value-object/profile/preferences";
import { UserId } from "@/domain/user/value-object/identity/user-id";
import { Username } from "@/domain/user/value-object/identity/username";

describe("User.recordSuccessfulLogin", () => {
  it("increments the login counter and updates lastVisit", () => {
    const registeredAt = new Date("2026-06-22T12:00:00.000Z");
    const user = User.register({
      id: UserId.fromString("11111111-1111-4111-8111-111111111111"),
      username: Username.fromString("john"),
      email: Email.fromString("john@example.com"),
      passwordHash: PasswordHash.fromString("hashed-password"),
      preferences: Preferences.create(),
      now: registeredAt,
    });

    const loginAt = new Date("2026-06-23T08:30:00.000Z");
    user.recordSuccessfulLogin(loginAt);

    const snapshot = user.toSnapshot();
    expect(snapshot.loginCount).toBe(1);
    expect(snapshot.lastVisit).toEqual(loginAt);
    expect(snapshot.updatedAt).toEqual(loginAt);
  });
});
