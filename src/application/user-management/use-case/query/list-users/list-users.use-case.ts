import {
  DEFAULT_ITEMS_PER_PAGE,
  MAX_ITEMS_PER_PAGE,
} from "@/application/shared/pagination";
import { UserReadModel } from "@/application/shared/dto/user-read-model";
import type { UserListReadModel } from "@/application/user-management/dto/user-list.read-model";
import type {
  UserListCriteria,
  UserRepositoryPort,
} from "@/application/shared/port/user-repository.port";
import type { ListUsersQuery } from "@/application/user-management/use-case/query/list-users/list-users.query";

const DEFAULT_ORDER_BY: UserListCriteria["orderBy"] = {
  field: "createdAt",
  direction: "DESC",
};

export class ListUsersUseCase {
  public constructor(private readonly users: UserRepositoryPort) {}

  public async execute(query: ListUsersQuery): Promise<UserListReadModel> {
    const page = Math.max(1, query.page ?? 1);
    const itemsPerPage = Math.min(
      MAX_ITEMS_PER_PAGE,
      Math.max(1, query.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE),
    );

    const criteria: UserListCriteria = {
      page,
      itemsPerPage,
      filters: query.filters,
      orderBy: query.order ?? DEFAULT_ORDER_BY,
    };

    const result = await this.users.list(criteria);

    return {
      items: result.users.map((user) => UserReadModel.fromUser(user)),
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page,
      itemsPerPage,
    };
  }
}
