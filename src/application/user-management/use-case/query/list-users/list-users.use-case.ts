import { Pagination } from "@/application/shared/pagination";
import { UserReadModel } from "@/application/shared/dto/user-read-model";
import type { UserListReadModel } from "@/application/user-management/dto/user-list.read-model";
import type {
  UserListCriteria,
  UserRepositoryPort,
} from "@/application/shared/port/user-repository.port";
import type { ListUsersQuery } from "@/application/user-management/use-case/query/list-users/list-users.query";

const DEFAULT_ORDER_BY: UserListCriteria["orderBy"] = [
  { field: "createdAt", direction: "DESC" },
];

export class ListUsersUseCase {
  public constructor(private readonly users: UserRepositoryPort) {}

  public async execute(query: ListUsersQuery): Promise<UserListReadModel> {
    const orderBy = query.order.length > 0 ? query.order : DEFAULT_ORDER_BY;
    const pagination = Pagination.fromRaw(query.page, query.itemsPerPage);

    const result = await this.users.list({
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
      filters: query.filters,
      orderBy: orderBy,
    });

    return {
      items: result.users.map((user) => UserReadModel.fromUser(user)),
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    };
  }
}
