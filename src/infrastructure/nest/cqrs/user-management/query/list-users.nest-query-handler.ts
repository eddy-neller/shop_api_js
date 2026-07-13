import { QueryHandler, type IQueryHandler } from "@nestjs/cqrs";
import { ListUsersQuery } from "@/application/user-management/use-case/query/list-users/list-users.query";
import { ListUsersUseCase } from "@/application/user-management/use-case/query/list-users/list-users.use-case";
import type { UserListReadModel } from "@/application/user-management/dto/user-list.read-model";

@QueryHandler(ListUsersQuery)
export class ListUsersNestQueryHandler
  implements IQueryHandler<ListUsersQuery, UserListReadModel>
{
  public constructor(private readonly useCase: ListUsersUseCase) {}

  public execute(query: ListUsersQuery): Promise<UserListReadModel> {
    return this.useCase.execute(query);
  }
}
