import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { LogoutCommand } from "@/application/auth/use-case/command/logout/logout.command";
import { LogoutUseCase } from "@/application/auth/use-case/command/logout/logout.use-case";

@CommandHandler(LogoutCommand)
export class LogoutNestCommandHandler
  implements ICommandHandler<LogoutCommand, void>
{
  public constructor(private readonly useCase: LogoutUseCase) {}

  public execute(command: LogoutCommand): Promise<void> {
    return this.useCase.execute(command);
  }
}
