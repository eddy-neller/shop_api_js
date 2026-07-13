import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { ConfirmPasswordResetCommand } from "@/application/account/use-case/command/confirm-password-reset/confirm-password-reset.command";
import { ConfirmPasswordResetUseCase } from "@/application/account/use-case/command/confirm-password-reset/confirm-password-reset.use-case";

@CommandHandler(ConfirmPasswordResetCommand)
export class ConfirmPasswordResetNestCommandHandler
  implements ICommandHandler<ConfirmPasswordResetCommand, void>
{
  public constructor(private readonly useCase: ConfirmPasswordResetUseCase) {}

  public execute(command: ConfirmPasswordResetCommand): Promise<void> {
    return this.useCase.execute(command);
  }
}
