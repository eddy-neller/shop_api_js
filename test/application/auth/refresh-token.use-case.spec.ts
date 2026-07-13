import { describe, expect, it } from "vitest";
import { RefreshTokenCommand } from "@/application/auth/use-case/command/refresh-token/refresh-token.command";
import { RefreshTokenUseCase } from "@/application/auth/use-case/command/refresh-token/refresh-token.use-case";
import { InvalidRefreshTokenException } from "@/domain/user/exception/security/invalid-refresh-token.exception";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/identity/email";
import { PasswordHash } from "@/domain/user/value-object/security/password-hash";
import { Preferences } from "@/domain/user/value-object/profile/preferences";
import { UserId } from "@/domain/user/value-object/identity/user-id";
import { UserRole } from "@/domain/user/value-object/access/user-role";
import { UserStatus } from "@/domain/user/value-object/lifecycle/user-status";
import { Username } from "@/domain/user/value-object/identity/username";
import { InMemoryRefreshTokenRepository } from "../user/in-memory-refresh-token.repository";
import { InMemoryUserRepository } from "../user/in-memory-user.repository";
import {
  fixedNow,
  makeClock,
  makeRefreshToken,
  makeRefreshTokenHasher,
  makeTokenIssuer,
  makeTransactional,
} from "../user/user-use-case-fixtures";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const FUTURE = new Date("2026-07-22T12:00:00.000Z");
const PAST = new Date("2026-06-21T12:00:00.000Z");

async function saveUser(
  repository: InMemoryUserRepository,
  status: UserStatus = UserStatus.active(),
): Promise<void> {
  const user = User.createByAdmin({
    id: UserId.fromString(USER_ID),
    username: Username.fromString("john"),
    email: Email.fromString("john@example.com"),
    passwordHash: PasswordHash.fromString("hashed-password"),
    roles: [UserRole.User],
    status,
    preferences: new Preferences(),
    now: fixedNow,
  });

  await repository.save(user);
}

function makeUseCase(
  repository: InMemoryUserRepository,
  refreshTokens: InMemoryRefreshTokenRepository,
): RefreshTokenUseCase {
  return new RefreshTokenUseCase(
    repository,
    refreshTokens,
    makeRefreshTokenHasher(),
    makeTokenIssuer(refreshTokens, "new-refresh"),
    makeClock(),
    makeTransactional(),
  );
}

describe("RefreshTokenUseCase", () => {
  it("rotates the refresh token and issues a new pair", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository);
    await refreshTokens.save(
      makeRefreshToken({
        userId: USER_ID,
        rawToken: "old-refresh",
        expiresAt: FUTURE,
      }),
    );

    const tokens = await makeUseCase(repository, refreshTokens).execute(
      new RefreshTokenCommand("old-refresh"),
    );

    expect(tokens.accessToken).toBe("access-token");
    expect(tokens.refreshToken).toBe("new-refresh");
    expect(refreshTokens.tokens).toHaveLength(1);
    expect(refreshTokens.tokens[0]?.toSnapshot().tokenHash).toBe(
      makeRefreshTokenHasher().hash("new-refresh"),
    );
  });

  it("rejects and removes an expired refresh token", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository);
    await refreshTokens.save(
      makeRefreshToken({
        userId: USER_ID,
        rawToken: "old-refresh",
        expiresAt: PAST,
      }),
    );

    await expect(
      makeUseCase(repository, refreshTokens).execute(
        new RefreshTokenCommand("old-refresh"),
      ),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenException);
    expect(refreshTokens.tokens).toHaveLength(0);
  });

  it("rejects an unknown refresh token", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository);

    await expect(
      makeUseCase(repository, refreshTokens).execute(
        new RefreshTokenCommand("does-not-exist"),
      ),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenException);
  });

  it("rejects and removes the token when the user is blocked", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository, UserStatus.blocked());
    await refreshTokens.save(
      makeRefreshToken({
        userId: USER_ID,
        rawToken: "old-refresh",
        expiresAt: FUTURE,
      }),
    );

    await expect(
      makeUseCase(repository, refreshTokens).execute(
        new RefreshTokenCommand("old-refresh"),
      ),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenException);
    expect(refreshTokens.tokens).toHaveLength(0);
  });
});
