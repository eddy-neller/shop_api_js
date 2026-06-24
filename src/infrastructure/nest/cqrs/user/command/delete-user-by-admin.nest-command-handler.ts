import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { DeleteUserByAdminCommand } from "@/application/user/use-case/command/delete-user-by-admin/delete-user-by-admin.command";
import { DeleteUserByAdminUseCase } from "@/application/user/use-case/command/delete-user-by-admin/delete-user-by-admin.use-case";

@CommandHandler(DeleteUserByAdminCommand)
export class DeleteUserByAdminNestCommandHandler
  implements ICommandHandler<DeleteUserByAdminCommand, void>
{
  public constructor(private readonly useCase: DeleteUserByAdminUseCase) {}

  public execute(command: DeleteUserByAdminCommand): Promise<void> {
    return this.useCase.execute(command);
  }
}
