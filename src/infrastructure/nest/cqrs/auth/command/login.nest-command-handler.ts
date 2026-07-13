import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import type { AuthTokensReadModel } from "@/application/auth/dto/auth-tokens.read-model";
import { LoginCommand } from "@/application/auth/use-case/command/login/login.command";
import { LoginUseCase } from "@/application/auth/use-case/command/login/login.use-case";

@CommandHandler(LoginCommand)
export class LoginNestCommandHandler implements ICommandHandler<
  LoginCommand,
  AuthTokensReadModel
> {
  public constructor(private readonly useCase: LoginUseCase) {}

  public execute(command: LoginCommand): Promise<AuthTokensReadModel> {
    return this.useCase.execute(command);
  }
}
