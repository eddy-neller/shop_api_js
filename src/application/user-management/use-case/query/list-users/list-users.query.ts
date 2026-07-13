import type { SortDirection } from "@/application/shared/sort-direction";
import type { UserSortField } from "@/application/shared/port/user-repository.port";

export class ListUsersQuery {
  public constructor(
    public readonly page: number | null,
    public readonly itemsPerPage: number | null,
    public readonly filters: { username?: string; email?: string },
    public readonly order: { field: UserSortField; direction: SortDirection } | null,
  ) {}
}
