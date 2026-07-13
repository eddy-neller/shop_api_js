import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { RegisterUserCommand } from "@/application/onboarding/use-case/command/register-user/register-user.command";
import { RegisterUserUseCase } from "@/application/onboarding/use-case/command/register-user/register-user.use-case";
import type { UserReadModel } from "@/application/shared/dto/user-read-model";

@CommandHandler(RegisterUserCommand)
export class RegisterUserNestCommandHandler implements ICommandHandler<
  RegisterUserCommand,
  UserReadModel
> {
  public constructor(private readonly useCase: RegisterUserUseCase) {}

  public execute(command: RegisterUserCommand): Promise<UserReadModel> {
    return this.useCase.execute(command);
  }
}
