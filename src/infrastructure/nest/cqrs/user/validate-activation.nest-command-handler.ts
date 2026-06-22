import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { ValidateActivationCommand } from "@/application/user/use-case/command/validate-activation/validate-activation.command";
import { ValidateActivationUseCase } from "@/application/user/use-case/command/validate-activation/validate-activation.use-case";

@CommandHandler(ValidateActivationCommand)
export class ValidateActivationNestCommandHandler
  implements ICommandHandler<ValidateActivationCommand, void>
{
  public constructor(private readonly useCase: ValidateActivationUseCase) {}

  public execute(command: ValidateActivationCommand): Promise<void> {
    return this.useCase.execute(command);
  }
}
