import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { UpdatePasswordCommand } from "@/application/user/use-case/command/update-password/update-password.command";
import { UpdatePasswordUseCase } from "@/application/user/use-case/command/update-password/update-password.use-case";

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordNestCommandHandler
  implements ICommandHandler<UpdatePasswordCommand, void>
{
  public constructor(private readonly useCase: UpdatePasswordUseCase) {}

  public execute(command: UpdatePasswordCommand): Promise<void> {
    return this.useCase.execute(command);
  }
}
