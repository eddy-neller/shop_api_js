import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { RequestActivationEmailCommand } from "@/application/onboarding/use-case/command/request-activation-email/request-activation-email.command";
import { RequestActivationEmailUseCase } from "@/application/onboarding/use-case/command/request-activation-email/request-activation-email.use-case";

@CommandHandler(RequestActivationEmailCommand)
export class RequestActivationEmailNestCommandHandler
  implements ICommandHandler<RequestActivationEmailCommand, void>
{
  public constructor(private readonly useCase: RequestActivationEmailUseCase) {}

  public execute(command: RequestActivationEmailCommand): Promise<void> {
    return this.useCase.execute(command);
  }
}
