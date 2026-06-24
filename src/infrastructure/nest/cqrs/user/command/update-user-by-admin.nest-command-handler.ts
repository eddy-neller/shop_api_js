import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import type { UserReadModel } from "@/application/user/dto/user-read-model";
import { UpdateUserByAdminCommand } from "@/application/user/use-case/command/update-user-by-admin/update-user-by-admin.command";
import { UpdateUserByAdminUseCase } from "@/application/user/use-case/command/update-user-by-admin/update-user-by-admin.use-case";

@CommandHandler(UpdateUserByAdminCommand)
export class UpdateUserByAdminNestCommandHandler
  implements ICommandHandler<UpdateUserByAdminCommand, UserReadModel>
{
  public constructor(private readonly useCase: UpdateUserByAdminUseCase) {}

  public execute(command: UpdateUserByAdminCommand): Promise<UserReadModel> {
    return this.useCase.execute(command);
  }
}
