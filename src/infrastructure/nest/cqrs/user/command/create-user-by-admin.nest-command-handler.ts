import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import type { UserReadModel } from "@/application/user/dto/user-read-model";
import { CreateUserByAdminCommand } from "@/application/user/use-case/command/create-user-by-admin/create-user-by-admin.command";
import { CreateUserByAdminUseCase } from "@/application/user/use-case/command/create-user-by-admin/create-user-by-admin.use-case";

@CommandHandler(CreateUserByAdminCommand)
export class CreateUserByAdminNestCommandHandler
  implements ICommandHandler<CreateUserByAdminCommand, UserReadModel>
{
  public constructor(private readonly useCase: CreateUserByAdminUseCase) {}

  public execute(command: CreateUserByAdminCommand): Promise<UserReadModel> {
    return this.useCase.execute(command);
  }
}
