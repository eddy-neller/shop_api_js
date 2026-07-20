const DEFAULT_PAGE = 1;
const DEFAULT_ITEMS_PER_PAGE = 30;

export class Pagination {
  private constructor(
    public readonly page: number,
    public readonly itemsPerPage: number,
  ) {}

  public static fromRaw(page: unknown, itemsPerPage: unknown): Pagination {
    return new Pagination(
      Pagination.toPositiveInteger(page) ?? DEFAULT_PAGE,
      Pagination.toPositiveInteger(itemsPerPage) ?? DEFAULT_ITEMS_PER_PAGE,
    );
  }

  public static fromValues(page: number, itemsPerPage: number): Pagination {
    return new Pagination(
      page > 0 ? page : DEFAULT_PAGE,
      itemsPerPage > 0 ? itemsPerPage : DEFAULT_ITEMS_PER_PAGE,
    );
  }

  private static toPositiveInteger(value: unknown): number | null {
    if (typeof value === "number") {
      return Number.isSafeInteger(value) && value > 0 ? value : null;
    }

    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
      return null;
    }

    const parsed = Number(value);

    return Number.isSafeInteger(parsed) ? parsed : null;
  }
}
