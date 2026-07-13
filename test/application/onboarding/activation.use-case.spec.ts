import { describe, expect, it } from "vitest";
import { RegisterUserCommand } from "@/application/onboarding/use-case/command/register-user/register-user.command";
import { RegisterUserUseCase } from "@/application/onboarding/use-case/command/register-user/register-user.use-case";
import { RequestActivationEmailCommand } from "@/application/onboarding/use-case/command/request-activation-email/request-activation-email.command";
import { RequestActivationEmailUseCase } from "@/application/onboarding/use-case/command/request-activation-email/request-activation-email.use-case";
import { ValidateActivationCommand } from "@/application/onboarding/use-case/command/validate-activation/validate-activation.command";
import { ValidateActivationUseCase } from "@/application/onboarding/use-case/command/validate-activation/validate-activation.use-case";
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

describe("Activation use cases", () => {
  it("requests and validates an activation token", async () => {
    const repository = new InMemoryUserRepository();
    const tokenProvider = makeTokenProvider("activation-token");
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

    const requestActivation = new RequestActivationEmailUseCase(
      repository,
      tokenProvider,
      makeClock(),
      makeTransactional(),
      makeConfig(),
    );
    await requestActivation.execute(
      new RequestActivationEmailCommand("john@example.com"),
    );

    const encodedToken = tokenProvider.encode(
      "activation-token",
      Email.fromString("john@example.com"),
    );
    const validateActivation = new ValidateActivationUseCase(
      repository,
      tokenProvider,
      makeClock(),
      makeTransactional(),
    );

    await validateActivation.execute(new ValidateActivationCommand(encodedToken));

    const user = await repository.findByActivationToken("activation-token");
    expect(user).toBeNull();
  });
});
