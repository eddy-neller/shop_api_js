import { QueryHandler, type IQueryHandler } from "@nestjs/cqrs";
import { DisplayUserQuery } from "@/application/account/use-case/query/display-user/display-user.query";
import { DisplayUserUseCase } from "@/application/account/use-case/query/display-user/display-user.use-case";
import type { UserReadModel } from "@/application/shared/dto/user-read-model";

@QueryHandler(DisplayUserQuery)
export class DisplayUserNestQueryHandler implements IQueryHandler<
  DisplayUserQuery,
  UserReadModel
> {
  public constructor(private readonly useCase: DisplayUserUseCase) {}

  public execute(query: DisplayUserQuery): Promise<UserReadModel> {
    return this.useCase.execute(query);
  }
}
