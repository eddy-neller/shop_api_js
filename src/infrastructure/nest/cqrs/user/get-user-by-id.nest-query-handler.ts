import { QueryHandler, type IQueryHandler } from "@nestjs/cqrs";
import { GetUserByIdQuery } from "@/application/user/use-case/query/get-by-id/get-by-id.query";
import { GetUserByIdUseCase } from "@/application/user/use-case/query/get-by-id/get-by-id.use-case";
import type { UserReadModel } from "@/application/user/dto/user-read-model";

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdNestQueryHandler implements IQueryHandler<
  GetUserByIdQuery,
  UserReadModel
> {
  public constructor(private readonly useCase: GetUserByIdUseCase) {}

  public execute(query: GetUserByIdQuery): Promise<UserReadModel> {
    return this.useCase.execute(query);
  }
}
