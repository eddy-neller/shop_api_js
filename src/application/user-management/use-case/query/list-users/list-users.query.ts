import type { UserOrderBy } from "@/application/shared/port/user-repository.port";

export class ListUsersQuery {
  public constructor(
    public readonly page: number | string | null,
    public readonly itemsPerPage: number | string | null,
    public readonly filters: { username?: string; email?: string },
    public readonly order: readonly UserOrderBy[],
  ) {}
}
