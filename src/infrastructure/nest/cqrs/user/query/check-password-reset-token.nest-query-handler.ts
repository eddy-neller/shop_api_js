import { QueryHandler, type IQueryHandler } from "@nestjs/cqrs";
import type { PasswordResetTokenCheckReadModel } from "@/application/user/dto/password-reset-token-check.read-model";
import { CheckPasswordResetTokenQuery } from "@/application/user/use-case/query/check-password-reset-token/check-password-reset-token.query";
import { CheckPasswordResetTokenUseCase } from "@/application/user/use-case/query/check-password-reset-token/check-password-reset-token.use-case";

@QueryHandler(CheckPasswordResetTokenQuery)
export class CheckPasswordResetTokenNestQueryHandler
  implements
    IQueryHandler<CheckPasswordResetTokenQuery, PasswordResetTokenCheckReadModel>
{
  public constructor(private readonly useCase: CheckPasswordResetTokenUseCase) {}

  public execute(
    query: CheckPasswordResetTokenQuery,
  ): Promise<PasswordResetTokenCheckReadModel> {
    return this.useCase.execute(query);
  }
}
