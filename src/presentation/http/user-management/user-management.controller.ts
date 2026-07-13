import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseFilters,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import type { Response } from "express";
import { DisplayUserQuery } from "@/application/account/use-case/query/display-user/display-user.query";
import { CreateUserByAdminCommand } from "@/application/user-management/use-case/command/create-user-by-admin/create-user-by-admin.command";
import { DeleteUserByAdminCommand } from "@/application/user-management/use-case/command/delete-user-by-admin/delete-user-by-admin.command";
import { UpdateUserByAdminCommand } from "@/application/user-management/use-case/command/update-user-by-admin/update-user-by-admin.command";
import { ListUsersQuery } from "@/application/user-management/use-case/query/list-users/list-users.query";
import type { UserListReadModel } from "@/application/user-management/dto/user-list.read-model";
import type { UserReadModel } from "@/application/shared/dto/user-read-model";
import { USER_SORT_FIELDS } from "@/application/shared/port/user-repository.port";
import { UserRole } from "@/domain/user/value-object/access/user-role";
import { Roles } from "@/presentation/http/shared/decorator/roles.decorator";
import { UserPresenter, type UserResponse } from "@/presentation/http/shared/presenter/user.response";
import { CreateUserByAdminRequest } from "@/presentation/http/user-management/dto/create-user-by-admin.request";
import { ListUsersRequest } from "@/presentation/http/user-management/dto/list-users.request";
import { UpdateUserByAdminRequest } from "@/presentation/http/user-management/dto/update-user-by-admin.request";
import { UserDomainExceptionFilter } from "@/presentation/http/shared/filter/user-domain-exception.filter";
import {
  UserListPresenter,
  type UserListItemResponse,
} from "@/presentation/http/user-management/presenter/user-list.response";

@Controller("users")
@UseFilters(UserDomainExceptionFilter)
@Roles(UserRole.Admin)
export class UserManagementController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly userPresenter: UserPresenter,
    private readonly userListPresenter: UserListPresenter,
  ) {}

  @Get()
  public async list(
    @Query() request: ListUsersRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserListItemResponse[]> {
    let order: ListUsersQuery["order"] = null;
    const requestedOrder = request.order;
    if (requestedOrder) {
      for (const field of USER_SORT_FIELDS) {
        const direction = requestedOrder[field];
        if (direction !== undefined) {
          order = { field, direction };
          break;
        }
      }
    }

    const result = await this.queryBus.execute<
      ListUsersQuery,
      UserListReadModel
    >(
      new ListUsersQuery(
        request.page ?? null,
        request.itemsPerPage ?? null,
        request.filters ?? {},
        order,
      ),
    );

    res.setHeader("X-Total-Count", result.totalItems);
    res.setHeader("X-Total-Pages", result.totalPages);

    return this.userListPresenter.present(result.items);
  }

  @Get(":id")
  public async getById(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<UserResponse> {
    const user = await this.queryBus.execute<DisplayUserQuery, UserReadModel>(
      new DisplayUserQuery(id),
    );

    return this.userPresenter.present(user);
  }

  @Post()
  public async createByAdmin(
    @Body() request: CreateUserByAdminRequest,
  ): Promise<UserResponse> {
    const user = await this.commandBus.execute<
      CreateUserByAdminCommand,
      UserReadModel
    >(
      new CreateUserByAdminCommand(
        request.email,
        request.username,
        request.plainPassword,
        request.roles,
        request.status,
        request.firstname ?? null,
        request.lastname ?? null,
      ),
    );

    return this.userPresenter.present(user);
  }

  @Patch(":id")
  public async updateByAdmin(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() request: UpdateUserByAdminRequest,
  ): Promise<UserResponse> {
    const user = await this.commandBus.execute<
      UpdateUserByAdminCommand,
      UserReadModel
    >(
      new UpdateUserByAdminCommand(
        id,
        request.email ?? null,
        request.username ?? null,
        request.plainPassword ?? null,
        request.roles ?? null,
        request.status ?? null,
        request.firstname ?? null,
        request.lastname ?? null,
      ),
    );

    return this.userPresenter.present(user);
  }

  @Delete(":id")
  @HttpCode(204)
  public async deleteByAdmin(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteUserByAdminCommand(id));
  }
}
