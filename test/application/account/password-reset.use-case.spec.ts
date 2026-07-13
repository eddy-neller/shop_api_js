import { describe, expect, it } from "vitest";
import { ConfirmPasswordResetCommand } from "@/application/account/use-case/command/confirm-password-reset/confirm-password-reset.command";
import { ConfirmPasswordResetUseCase } from "@/application/account/use-case/command/confirm-password-reset/confirm-password-reset.use-case";
import { RegisterUserCommand } from "@/application/onboarding/use-case/command/register-user/register-user.command";
import { RegisterUserUseCase } from "@/application/onboarding/use-case/command/register-user/register-user.use-case";
import { RequestPasswordResetCommand } from "@/application/account/use-case/command/request-password-reset/request-password-reset.command";
import { RequestPasswordResetUseCase } from "@/application/account/use-case/command/request-password-reset/request-password-reset.use-case";
import { Email } from "@/domain/user/value-object/identity/email";
import {
  makeClock,
  makeConfig,
  makeHasher,
  makeTokenProvider,
  makeTransactional,
  makeUniquenessChecker,
} from "../user/user-use-case-fixtures";
import { InMemoryUserRepository } from "../user/in-memory-user.repository";

describe("Password reset use cases", () => {
  it("requests and confirms a password reset", async () => {
    const repository = new InMemoryUserRepository();
    const tokenProvider = makeTokenProvider("reset-token");
    const register = new RegisterUserUseCase(
      repository,
      makeUniquenessChecker(repository),
      makeHasher(),
      tokenProvider,
      makeClock(),
      makeTransactional(),
      makeConfig(),
    );
    await register.execute(
      new RegisterUserCommand("john@example.com", "john", "ChangeMe123!"),
    );

    const requestReset = new RequestPasswordResetUseCase(
      repository,
      tokenProvider,
      makeClock(),
      makeTransactional(),
      makeConfig(),
    );
    await requestReset.execute(new RequestPasswordResetCommand("john@example.com"));

    const encodedToken = tokenProvider.encode(
      "reset-token",
      Email.fromString("john@example.com"),
    );
    const confirmReset = new ConfirmPasswordResetUseCase(
      repository,
      tokenProvider,
      makeHasher("new-hashed-password"),
      makeClock(),
      makeTransactional(),
    );

    await confirmReset.execute(
      new ConfirmPasswordResetCommand(encodedToken, "ChangeMe456!"),
    );

    const user = await repository.findByEmail(Email.fromString("john@example.com"));
    expect(user?.toSnapshot().passwordHash).toBe("new-hashed-password");
    expect(user?.toSnapshot().resetPassword.token).toBeNull();
  });
});
