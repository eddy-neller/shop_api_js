import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import type { UserReadModel } from "@/application/user/dto/user-read-model";
import { UpdateAvatarCommand } from "@/application/user/use-case/command/update-avatar/update-avatar.command";
import { UpdateAvatarUseCase } from "@/application/user/use-case/command/update-avatar/update-avatar.use-case";

@CommandHandler(UpdateAvatarCommand)
export class UpdateAvatarNestCommandHandler
  implements ICommandHandler<UpdateAvatarCommand, UserReadModel>
{
  public constructor(private readonly useCase: UpdateAvatarUseCase) {}

  public execute(command: UpdateAvatarCommand): Promise<UserReadModel> {
    return this.useCase.execute(command);
  }
}
