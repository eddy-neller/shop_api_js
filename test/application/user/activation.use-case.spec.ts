import { describe, expect, it } from "vitest";
import { RegisterUserCommand } from "@/application/user/use-case/command/register/register.command";
import { RegisterUserUseCase } from "@/application/user/use-case/command/register/register.use-case";
import { RequestActivationEmailCommand } from "@/application/user/use-case/command/request-activation-email/request-activation-email.command";
import { RequestActivationEmailUseCase } from "@/application/user/use-case/command/request-activation-email/request-activation-email.use-case";
import { ValidateActivationCommand } from "@/application/user/use-case/command/validate-activation/validate-activation.command";
import { ValidateActivationUseCase } from "@/application/user/use-case/command/validate-activation/validate-activation.use-case";
import { Email } from "@/domain/user/value-object/email";
import {
  makeClock,
  makeConfig,
  makeHasher,
  makeIdGenerator,
  makeTokenProvider,
  makeTransactional,
  makeUniquenessChecker,
} from "./user-use-case-fixtures";
import { InMemoryUserRepository } from "./in-memory-user.repository";

describe("Activation use cases", () => {
  it("requests and validates an activation token", async () => {
    const repository = new InMemoryUserRepository();
    const tokenProvider = makeTokenProvider("activation-token");
    const register = new RegisterUserUseCase(
      repository,
      makeUniquenessChecker(repository),
      makeHasher(),
      makeIdGenerator(),
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
