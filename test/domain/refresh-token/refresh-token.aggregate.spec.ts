import { describe, expect, it } from "vitest";
import { RefreshToken } from "@/domain/refresh-token/model/refresh-token.aggregate";
import { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import { RefreshTokenId } from "@/domain/refresh-token/value-object/refresh-token-id";
import { UserDomainException } from "@/domain/user/exception/user-domain-exception";
import { UserId } from "@/domain/user/value-object/identity/user-id";

const TOKEN_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "33333333-3333-4333-8333-333333333333";
const NOW = new Date("2026-06-22T12:00:00.000Z");
const FUTURE = new Date("2026-07-22T12:00:00.000Z");
const PAST = new Date("2026-05-22T12:00:00.000Z");

function issue(expiresAt = FUTURE): RefreshToken {
  return RefreshToken.issue({
    id: RefreshTokenId.fromString(TOKEN_ID),
    userId: UserId.fromString(USER_ID),
    tokenHash: RefreshTokenHash.fromString("hashed-token"),
    expiresAt,
    now: NOW,
  });
}

describe("RefreshToken", () => {
  it("issues a token expiring in the future", () => {
    const token = issue();
    const snapshot = token.toSnapshot();

    expect(snapshot.id).toBe(TOKEN_ID);
    expect(snapshot.userId).toBe(USER_ID);
    expect(snapshot.tokenHash).toBe("hashed-token");
    expect(snapshot.expiresAt).toEqual(FUTURE);
    expect(snapshot.createdAt).toEqual(NOW);
  });

  it("rejects an expiry that is not in the future", () => {
    expect(() => issue(NOW)).toThrow(UserDomainException);
    expect(() => issue(PAST)).toThrow(UserDomainException);
  });

  it("reports expiry relative to the given instant", () => {
    const token = issue();

    expect(token.isExpired(PAST)).toBe(false);
    expect(token.isExpired(new Date(FUTURE.getTime() + 1))).toBe(true);
    expect(token.isExpired(FUTURE)).toBe(true);
  });

  it("knows which user it belongs to", () => {
    const token = issue();

    expect(token.belongsTo(UserId.fromString(USER_ID))).toBe(true);
    expect(token.belongsTo(UserId.fromString(OTHER_USER_ID))).toBe(false);
  });

  it("rehydrates from a snapshot without the future-expiry guard", () => {
    const token = RefreshToken.fromSnapshot({
      id: TOKEN_ID,
      userId: USER_ID,
      tokenHash: "hashed-token",
      expiresAt: PAST,
      createdAt: NOW,
    });

    expect(token.isExpired(NOW)).toBe(true);
  });
});
