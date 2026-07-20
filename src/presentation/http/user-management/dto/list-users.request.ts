import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";

import type { SortDirection } from "@/application/shared/sort-direction";
import { IsSortDirection } from "@/presentation/http/shared/validation/is-sort-direction.decorator";

const trimToUndefined = ({ value }: { value: unknown }): string | undefined =>
  typeof value === "string" ? value.trim() || undefined : undefined;

export class ListUsersFilters {
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  public username?: string;

  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  public email?: string;
}

export class ListUsersOrder {
  @IsSortDirection()
  public username?: SortDirection;

  @IsSortDirection()
  public email?: SortDirection;

  @IsSortDirection()
  public createdAt?: SortDirection;
}

export class ListUsersRequest {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public itemsPerPage?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ListUsersFilters)
  public filters?: ListUsersFilters;

  @IsOptional()
  @ValidateNested()
  @Type(() => ListUsersOrder)
  public order?: ListUsersOrder;
}
