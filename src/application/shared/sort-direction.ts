/**
 * Sens de tri partage par tous les criteres de listing.
 * `SORT_DIRECTIONS` est la source de verite runtime; `SortDirection` en derive
 * le type pour eviter toute divergence entre validation et typage.
 */
export const SORT_DIRECTIONS = ["ASC", "DESC"] as const;

export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export function isSortDirection(value: string): value is SortDirection {
  return (SORT_DIRECTIONS as readonly string[]).includes(value);
}
