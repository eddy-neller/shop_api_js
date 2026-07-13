import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { ResetWrongPasswordAttemptsCommand } from "@/application/account/use-case/command/reset-wrong-password-attempts/reset-wrong-password-attempts.command";
import { ResetWrongPasswordAttemptsUseCase } from "@/application/account/use-case/command/reset-wrong-password-attempts/reset-wrong-password-attempts.use-case";

@CommandHandler(ResetWrongPasswordAttemptsCommand)
export class ResetWrongPasswordAttemptsNestCommandHandler
  implements ICommandHandler<ResetWrongPasswordAttemptsCommand, void>
{
  public constructor(
    private readonly useCase: ResetWrongPasswordAttemptsUseCase,
  ) {}

  public execute(command: ResetWrongPasswordAttemptsCommand): Promise<void> {
    return this.useCase.execute(command);
  }
}
