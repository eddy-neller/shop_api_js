import { describe, expect, it } from "vitest";
import { RegisterUserCommand } from "@/application/user/use-case/command/register-user/register-user.command";
import { RegisterUserUseCase } from "@/application/user/use-case/command/register-user/register-user.use-case";
import { RegisterWrongPasswordAttemptCommand } from "@/application/user/use-case/command/register-wrong-password-attempt/register-wrong-password-attempt.command";
import { RegisterWrongPasswordAttemptUseCase } from "@/application/user/use-case/command/register-wrong-password-attempt/register-wrong-password-attempt.use-case";
import { ResetWrongPasswordAttemptsCommand } from "@/application/user/use-case/command/reset-wrong-password-attempts/reset-wrong-password-attempts.command";
import { ResetWrongPasswordAttemptsUseCase } from "@/application/user/use-case/command/reset-wrong-password-attempts/reset-wrong-password-attempts.use-case";
import { Email } from "@/domain/user/value-object/email";
import {
  makeClock,
  makeConfig,
  makeHasher,
  makeTokenProvider,
  makeTransactional,
  makeUniquenessChecker,
} from "./user-use-case-fixtures";
import { InMemoryUserRepository } from "./in-memory-user.repository";

describe("Wrong password attempt use cases", () => {
  it("blocks and unblocks a user through wrong password counters", async () => {
    const repository = new InMemoryUserRepository();
    const register = new RegisterUserUseCase(
      repository,
      makeUniquenessChecker(repository),
      makeHasher(),
      makeTokenProvider("activation-token"),
      makeClock(),
      makeTransactional(),
      makeConfig(),
    );
    await register.execute(
      new RegisterUserCommand("john@example.com", "john", "ChangeMe123!"),
    );

    const registerAttempt = new RegisterWrongPasswordAttemptUseCase(
      repository,
      makeClock(),
      makeConfig(),
      makeTransactional(),
    );
    await registerAttempt.execute(
      new RegisterWrongPasswordAttemptCommand("john@example.com"),
    );
    await registerAttempt.execute(
      new RegisterWrongPasswordAttemptCommand("john@example.com"),
    );

    const blockedUser = await repository.findByEmail(
      Email.fromString("john@example.com"),
    );
    expect(blockedUser?.isLocked()).toBe(true);

    const resetAttempts = new ResetWrongPasswordAttemptsUseCase(
      repository,
      makeClock(),
      makeTransactional(),
    );
    await resetAttempts.execute(
      new ResetWrongPasswordAttemptsCommand(
        "11111111-1111-4111-8111-111111111111",
      ),
    );

    const unblockedUser = await repository.findByEmail(
      Email.fromString("john@example.com"),
    );
    expect(unblockedUser?.isLocked()).toBe(false);
    expect(unblockedUser?.toSnapshot().security.totalWrongPassword).toBe(0);
  });
});
