import { describe, expect, it } from "vitest";
import { CheckPasswordResetTokenQuery } from "@/application/account/use-case/query/check-password-reset-token/check-password-reset-token.query";
import { CheckPasswordResetTokenUseCase } from "@/application/account/use-case/query/check-password-reset-token/check-password-reset-token.use-case";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/identity/email";
import { PasswordHash } from "@/domain/user/value-object/security/password-hash";
import { Preferences } from "@/domain/user/value-object/profile/preferences";
import { UserId } from "@/domain/user/value-object/identity/user-id";
import { UserRole } from "@/domain/user/value-object/access/user-role";
import { UserStatus } from "@/domain/user/value-object/lifecycle/user-status";
import { Username } from "@/domain/user/value-object/identity/username";
import { fixedNow, makeClock, makeTokenProvider } from "../user/user-use-case-fixtures";
import { InMemoryUserRepository } from "../user/in-memory-user.repository";

const RAW_TOKEN = "raw-token";
const EMAIL = "john@example.com";

async function seedUserWithResetToken(
  repository: InMemoryUserRepository,
): Promise<void> {
  const user = User.createByAdmin({
    id: UserId.fromString("11111111-1111-4111-8111-111111111111"),
    username: Username.fromString("john"),
    email: Email.fromString(EMAIL),
    passwordHash: PasswordHash.fromString("hashed-password"),
    roles: [UserRole.User],
    status: UserStatus.active(),
    preferences: Preferences.create(),
    now: fixedNow,
  });

  const expiresAt = new Date(fixedNow.getTime() + 15 * 60 * 1000);
  user.requestPasswordReset(RAW_TOKEN, expiresAt, fixedNow);

  await repository.save(user);
}

function makeUseCase(
  repository: InMemoryUserRepository,
): CheckPasswordResetTokenUseCase {
  return new CheckPasswordResetTokenUseCase(
    repository,
    makeTokenProvider(RAW_TOKEN),
    makeClock(),
  );
}

describe("CheckPasswordResetTokenUseCase", () => {
  it("returns isValid true for a matching, non-expired token", async () => {
    const repository = new InMemoryUserRepository();
    await seedUserWithResetToken(repository);
    const useCase = makeUseCase(repository);

    const encoded = makeTokenProvider(RAW_TOKEN).encode(
      RAW_TOKEN,
      Email.fromString(EMAIL),
    );

    const result = await useCase.execute(
      new CheckPasswordResetTokenQuery(encoded),
    );

    expect(result.isValid).toBe(true);
  });

  it("returns isValid false for an unknown token", async () => {
    const repository = new InMemoryUserRepository();
    await seedUserWithResetToken(repository);
    const useCase = makeUseCase(repository);

    const encoded = makeTokenProvider(RAW_TOKEN).encode(
      "wrong-token",
      Email.fromString(EMAIL),
    );

    const result = await useCase.execute(
      new CheckPasswordResetTokenQuery(encoded),
    );

    expect(result.isValid).toBe(false);
  });

  it("returns isValid false when the email does not match the token owner", async () => {
    const repository = new InMemoryUserRepository();
    await seedUserWithResetToken(repository);
    const useCase = makeUseCase(repository);

    const encoded = makeTokenProvider(RAW_TOKEN).encode(
      RAW_TOKEN,
      Email.fromString("intruder@example.com"),
    );

    const result = await useCase.execute(
      new CheckPasswordResetTokenQuery(encoded),
    );

    expect(result.isValid).toBe(false);
  });
});
