import { describe, expect, it } from "vitest";
import { LogoutCommand } from "@/application/auth/use-case/command/logout/logout.command";
import { LogoutUseCase } from "@/application/auth/use-case/command/logout/logout.use-case";
import { InMemoryRefreshTokenRepository } from "../user/in-memory-refresh-token.repository";
import {
  makeRefreshToken,
  makeRefreshTokenHasher,
  makeTransactional,
} from "../user/user-use-case-fixtures";

describe("LogoutUseCase", () => {
  it("revokes the provided refresh token", async () => {
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await refreshTokens.save(
      makeRefreshToken({
        userId: "11111111-1111-4111-8111-111111111111",
        rawToken: "refresh",
        expiresAt: new Date("2026-07-22T12:00:00.000Z"),
      }),
    );

    await new LogoutUseCase(
      refreshTokens,
      makeRefreshTokenHasher(),
      makeTransactional(),
    ).execute(
      new LogoutCommand("11111111-1111-4111-8111-111111111111", "refresh"),
    );

    expect(refreshTokens.tokens).toHaveLength(0);
  });

  it("is idempotent when the token is unknown", async () => {
    const refreshTokens = new InMemoryRefreshTokenRepository();

    await expect(
      new LogoutUseCase(
        refreshTokens,
        makeRefreshTokenHasher(),
        makeTransactional(),
      ).execute(
        new LogoutCommand("11111111-1111-4111-8111-111111111111", "missing"),
      ),
    ).resolves.toBeUndefined();
  });

  it("does not revoke a refresh token owned by another user", async () => {
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await refreshTokens.save(
      makeRefreshToken({
        userId: "22222222-2222-4222-8222-222222222222",
        rawToken: "refresh",
        expiresAt: new Date("2026-07-22T12:00:00.000Z"),
      }),
    );

    await expect(
      new LogoutUseCase(
        refreshTokens,
        makeRefreshTokenHasher(),
        makeTransactional(),
      ).execute(
        new LogoutCommand("11111111-1111-4111-8111-111111111111", "refresh"),
      ),
    ).resolves.toBeUndefined();

    expect(refreshTokens.tokens).toHaveLength(1);
  });
});
