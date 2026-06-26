import { applyDecorators } from "@nestjs/common";
import { IsIn, IsOptional } from "class-validator";

import { SORT_DIRECTIONS } from "@/application/shared/sort-direction";

export function IsSortDirection(): PropertyDecorator {
  return applyDecorators(IsOptional(), IsIn(SORT_DIRECTIONS));
}
