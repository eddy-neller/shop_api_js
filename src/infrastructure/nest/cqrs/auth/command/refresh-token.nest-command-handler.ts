import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import type { AuthTokensReadModel } from "@/application/auth/dto/auth-tokens.read-model";
import { RefreshTokenCommand } from "@/application/auth/use-case/command/refresh-token/refresh-token.command";
import { RefreshTokenUseCase } from "@/application/auth/use-case/command/refresh-token/refresh-token.use-case";

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenNestCommandHandler implements ICommandHandler<
  RefreshTokenCommand,
  AuthTokensReadModel
> {
  public constructor(private readonly useCase: RefreshTokenUseCase) {}

  public execute(command: RefreshTokenCommand): Promise<AuthTokensReadModel> {
    return this.useCase.execute(command);
  }
}
