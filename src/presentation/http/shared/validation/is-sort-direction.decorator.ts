import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsIn, IsOptional } from "class-validator";

import { SORT_DIRECTIONS } from "@/application/shared/sort-direction";

export function IsSortDirection(): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }: { value: unknown }) =>
      typeof value === "string" ? value.trim().toUpperCase() : value,
    ),
    IsIn(SORT_DIRECTIONS),
  );
}
