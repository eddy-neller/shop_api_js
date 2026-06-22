import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { RequestPasswordResetCommand } from "@/application/user/use-case/command/request-password-reset/request-password-reset.command";
import { RequestPasswordResetUseCase } from "@/application/user/use-case/command/request-password-reset/request-password-reset.use-case";

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetNestCommandHandler
  implements ICommandHandler<RequestPasswordResetCommand, void>
{
  public constructor(private readonly useCase: RequestPasswordResetUseCase) {}

  public execute(command: RequestPasswordResetCommand): Promise<void> {
    return this.useCase.execute(command);
  }
}
