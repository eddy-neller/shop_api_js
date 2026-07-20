import { describe, expect, it } from "vitest";
import { Pagination } from "@/application/shared/pagination";

describe("Pagination", () => {
  it("uses valid raw positive integers", () => {
    const pagination = Pagination.fromRaw("2", 15);

    expect(pagination).toEqual({ page: 2, itemsPerPage: 15 });
  });

  it.each([
    [null, null],
    [0, 0],
    [-1, -1],
    ["1.5", "3.5"],
    ["invalid", "invalid"],
  ])("falls back to defaults for raw values %j and %j", (page, itemsPerPage) => {
    const pagination = Pagination.fromRaw(page, itemsPerPage);

    expect(pagination).toEqual({ page: 1, itemsPerPage: 30 });
  });

  it("normalizes non-positive typed values", () => {
    const pagination = Pagination.fromValues(0, -10);

    expect(pagination).toEqual({ page: 1, itemsPerPage: 30 });
  });
});
