import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { RegisterWrongPasswordAttemptCommand } from "@/application/user/use-case/command/register-wrong-password-attempt/register-wrong-password-attempt.command";
import { RegisterWrongPasswordAttemptUseCase } from "@/application/user/use-case/command/register-wrong-password-attempt/register-wrong-password-attempt.use-case";

@CommandHandler(RegisterWrongPasswordAttemptCommand)
export class RegisterWrongPasswordAttemptNestCommandHandler
  implements ICommandHandler<RegisterWrongPasswordAttemptCommand, void>
{
  public constructor(
    private readonly useCase: RegisterWrongPasswordAttemptUseCase,
  ) {}

  public execute(command: RegisterWrongPasswordAttemptCommand): Promise<void> {
    return this.useCase.execute(command);
  }
}
