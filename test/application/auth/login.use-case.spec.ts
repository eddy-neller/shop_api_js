import { describe, expect, it } from "vitest";
import type { PasswordHasherPort } from "@/application/shared/port/password-hasher.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import { LoginCommand } from "@/application/auth/use-case/command/login/login.command";
import { LoginUseCase } from "@/application/auth/use-case/command/login/login.use-case";
import { AccountNotActivatedException } from "@/domain/user/exception/lifecycle/account-not-activated.exception";
import { InvalidCredentialsException } from "@/domain/user/exception/security/invalid-credentials.exception";
import { UserLockedException } from "@/domain/user/exception/security/user-locked.exception";
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
  makeConfig,
  makeHasher,
  makeTokenIssuer,
  makeTransactional,
} from "../user/user-use-case-fixtures";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const EMAIL = "john@example.com";

async function saveUser(
  repository: InMemoryUserRepository,
  status: UserStatus = UserStatus.active(),
): Promise<void> {
  const user = User.createByAdmin({
    id: UserId.fromString(USER_ID),
    username: Username.fromString("john"),
    email: Email.fromString(EMAIL),
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
  hasher: PasswordHasherPort = makeHasher(),
  transactional: TransactionalPort = makeTransactional(),
): LoginUseCase {
  return new LoginUseCase(
    repository,
    hasher,
    makeTokenIssuer(refreshTokens, "refresh-token"),
    makeClock(),
    makeConfig(),
    transactional,
  );
}

describe("LoginUseCase", () => {
  it("issues access and refresh tokens on valid credentials", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository);

    const tokens = await makeUseCase(repository, refreshTokens).execute(
      new LoginCommand(EMAIL, "ChangeMe123!"),
    );

    expect(tokens.accessToken).toBe("access-token");
    expect(tokens.refreshToken).toBe("refresh-token");
    expect(tokens.tokenType).toBe("Bearer");
    expect(tokens.expiresIn).toBe(900);

    expect(refreshTokens.tokens).toHaveLength(1);
    const user = await repository.findByEmail(Email.fromString(EMAIL));
    expect(user?.toSnapshot().loginCount).toBe(1);
  });

  it("rejects an unknown email with invalid credentials", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();

    await expect(
      makeUseCase(repository, refreshTokens).execute(
        new LoginCommand("missing@example.com", "ChangeMe123!"),
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it("records a wrong attempt and rejects an invalid password", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository);

    const useCase = makeUseCase(
      repository,
      refreshTokens,
      makeHasher("hashed-password", false),
    );

    await expect(
      useCase.execute(new LoginCommand(EMAIL, "WrongPass1!")),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    const user = await repository.findByEmail(Email.fromString(EMAIL));
    expect(user?.toSnapshot().security.totalWrongPassword).toBe(1);
    expect(refreshTokens.tokens).toHaveLength(0);
  });

  it("commits a wrong-password attempt before returning its error", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository);

    let committed = false;
    const transactional: TransactionalPort = {
      execute: async (callback) => {
        const result = await callback();
        committed = true;

        return result;
      },
    };
    const useCase = makeUseCase(
      repository,
      refreshTokens,
      makeHasher("hashed-password", false),
      transactional,
    );

    await expect(
      useCase.execute(new LoginCommand(EMAIL, "WrongPass1!")),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(committed).toBe(true);
  });

  it("locks the account once the attempts threshold is reached", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository);

    const useCase = makeUseCase(
      repository,
      refreshTokens,
      makeHasher("hashed-password", false),
    );

    // makeConfig() expose MAX_LOGIN_ATTEMPTS = 2.
    await expect(
      useCase.execute(new LoginCommand(EMAIL, "WrongPass1!")),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
    await expect(
      useCase.execute(new LoginCommand(EMAIL, "WrongPass1!")),
    ).rejects.toBeInstanceOf(UserLockedException);

    const user = await repository.findByEmail(Email.fromString(EMAIL));
    expect(user?.isLocked()).toBe(true);
  });

  it("rejects a blocked account with a locked error", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository, UserStatus.blocked());

    await expect(
      makeUseCase(repository, refreshTokens).execute(
        new LoginCommand(EMAIL, "ChangeMe123!"),
      ),
    ).rejects.toBeInstanceOf(UserLockedException);
  });

  it("rejects an inactive account that is not yet activated", async () => {
    const repository = new InMemoryUserRepository();
    const refreshTokens = new InMemoryRefreshTokenRepository();
    await saveUser(repository, UserStatus.inactive());

    await expect(
      makeUseCase(repository, refreshTokens).execute(
        new LoginCommand(EMAIL, "ChangeMe123!"),
      ),
    ).rejects.toBeInstanceOf(AccountNotActivatedException);
  });
});
