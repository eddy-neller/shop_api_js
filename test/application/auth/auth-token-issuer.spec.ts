import { describe, expect, it } from "vitest";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/identity/email";
import { PasswordHash } from "@/domain/user/value-object/security/password-hash";
import { Preferences } from "@/domain/user/value-object/profile/preferences";
import { UserId } from "@/domain/user/value-object/identity/user-id";
import { UserRole } from "@/domain/user/value-object/access/user-role";
import { UserStatus } from "@/domain/user/value-object/lifecycle/user-status";
import { Username } from "@/domain/user/value-object/identity/username";
import { InMemoryRefreshTokenRepository } from "../user/in-memory-refresh-token.repository";
import {
  fixedNow,
  makeRefreshTokenHasher,
  makeTokenIssuer,
} from "../user/user-use-case-fixtures";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function makeUser(): User {
  return User.createByAdmin({
    id: UserId.fromString(USER_ID),
    username: Username.fromString("john"),
    email: Email.fromString("john@example.com"),
    passwordHash: PasswordHash.fromString("hashed-password"),
    roles: [UserRole.User],
    status: UserStatus.active(),
    preferences: Preferences.create(),
    now: fixedNow,
  });
}

describe("AuthTokenIssuer", () => {
  it("issues an access token and persists a hashed refresh token", async () => {
    const refreshTokens = new InMemoryRefreshTokenRepository();
    const issuer = makeTokenIssuer(refreshTokens, "issued-refresh");

    const tokens = await issuer.issue(makeUser(), fixedNow);

    expect(tokens.accessToken).toBe("access-token");
    expect(tokens.refreshToken).toBe("issued-refresh");
    expect(tokens.tokenType).toBe("Bearer");
    expect(tokens.expiresIn).toBe(900);

    expect(refreshTokens.tokens).toHaveLength(1);
    const stored = refreshTokens.tokens[0]?.toSnapshot();
    expect(stored?.tokenHash).toBe(makeRefreshTokenHasher().hash("issued-refresh"));
    expect(stored?.userId).toBe(USER_ID);
    // JWT_REFRESH_TTL par defaut = P30D a partir de fixedNow (2026-06-22).
    expect(stored?.expiresAt.toISOString()).toBe("2026-07-22T12:00:00.000Z");
  });
});
