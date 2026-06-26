import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ConfirmPasswordResetCommand } from "@/application/user/use-case/command/confirm-password-reset/confirm-password-reset.command";
import { CreateUserByAdminCommand } from "@/application/user/use-case/command/create-user-by-admin/create-user-by-admin.command";
import { DeleteUserByAdminCommand } from "@/application/user/use-case/command/delete-user-by-admin/delete-user-by-admin.command";
import { RegisterUserCommand } from "@/application/user/use-case/command/register-user/register-user.command";
import { RequestActivationEmailCommand } from "@/application/user/use-case/command/request-activation-email/request-activation-email.command";
import { RequestPasswordResetCommand } from "@/application/user/use-case/command/request-password-reset/request-password-reset.command";
import { UpdateAvatarCommand } from "@/application/user/use-case/command/update-avatar/update-avatar.command";
import { UpdatePasswordCommand } from "@/application/user/use-case/command/update-password/update-password.command";
import { UpdateUserByAdminCommand } from "@/application/user/use-case/command/update-user-by-admin/update-user-by-admin.command";
import { ValidateActivationCommand } from "@/application/user/use-case/command/validate-activation/validate-activation.command";
import type { PasswordResetTokenCheckReadModel } from "@/application/user/dto/password-reset-token-check.read-model";
import type { UserReadModel } from "@/application/user/dto/user-read-model";
import { CheckPasswordResetTokenQuery } from "@/application/user/use-case/query/check-password-reset-token/check-password-reset-token.query";
import { DisplayUserQuery } from "@/application/user/use-case/query/display-user/display-user.query";
import { ListUsersQuery } from "@/application/user/use-case/query/list-users/list-users.query";
import { USER_SORT_FIELDS } from "@/application/user/port/user-repository.port";
import type { UserListReadModel } from "@/application/user/dto/user-list.read-model";
import { ListUsersRequest } from "@/presentation/http/user/dto/list-users.request";
import {
  UserListPresenter,
  type UserListItemResponse,
} from "@/presentation/http/user/presenter/user-list.response";
import { CheckPasswordResetTokenRequest } from "@/presentation/http/user/dto/check-password-reset-token.request";
import { ConfirmPasswordResetRequest } from "@/presentation/http/user/dto/confirm-password-reset.request";
import { CreateUserByAdminRequest } from "@/presentation/http/user/dto/create-user-by-admin.request";
import { RegisterUserRequest } from "@/presentation/http/user/dto/register-user.request";
import { RequestActivationEmailRequest } from "@/presentation/http/user/dto/request-activation-email.request";
import { RequestPasswordResetRequest } from "@/presentation/http/user/dto/request-password-reset.request";
import { UpdatePasswordRequest } from "@/presentation/http/user/dto/update-password.request";
import { UpdateUserByAdminRequest } from "@/presentation/http/user/dto/update-user-by-admin.request";
import { ValidateActivationRequest } from "@/presentation/http/user/dto/validate-activation.request";
import { UserDomainExceptionFilter } from "@/presentation/http/user/filter/user-domain-exception.filter";
import {
  UserPresenter,
  type UserResponse,
} from "@/presentation/http/user/presenter/user.response";

// Borne de securite au bord HTTP: rejette tot un upload manifestement trop
// gros avant de le charger entierement en memoire (protection memoire / DoS
// basique). Ce n'est PAS la limite metier de l'avatar: la vraie limite est
// `AVATAR_MAX_SIZE` (configurable), validee en infra par
// `SharpAvatarImageValidator`. Garder cette borne >= toute valeur plausible de
// `AVATAR_MAX_SIZE` pour ne jamais masquer la validation metier.
const MAX_AVATAR_UPLOAD_BYTES = 3 * 1024 * 1024;

@Controller("users")
@UseFilters(UserDomainExceptionFilter)
export class UserController {
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

  @Patch(":id/password")
  @HttpCode(204)
  public async updatePassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() request: UpdatePasswordRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdatePasswordCommand(
        id,
        request.currentPassword,
        request.newPassword,
      ),
    );
  }

  @Delete(":id")
  @HttpCode(204)
  public async deleteByAdmin(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteUserByAdminCommand(id));
  }

  @Post("register")
  public async register(
    @Body() request: RegisterUserRequest,
  ): Promise<UserResponse> {
    const user = await this.commandBus.execute<
      RegisterUserCommand,
      UserReadModel
    >(
      new RegisterUserCommand(
        request.email,
        request.username,
        request.password,
        request.preferences ?? null,
      ),
    );

    return this.userPresenter.present(user);
  }

  @Post("register/email-activation-request")
  @HttpCode(204)
  public async requestActivationEmail(
    @Body() request: RequestActivationEmailRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new RequestActivationEmailCommand(request.email),
    );
  }

  @Post("register/validation")
  @HttpCode(204)
  public async validateActivation(
    @Body() request: ValidateActivationRequest,
  ): Promise<void> {
    await this.commandBus.execute(new ValidateActivationCommand(request.token));
  }

  @Post("reset-password/request")
  @HttpCode(204)
  public async requestPasswordReset(
    @Body() request: RequestPasswordResetRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new RequestPasswordResetCommand(request.email),
    );
  }

  @Post("reset-password/check")
  public async checkPasswordResetToken(
    @Body() request: CheckPasswordResetTokenRequest,
  ): Promise<PasswordResetTokenCheckReadModel> {
    return this.queryBus.execute<
      CheckPasswordResetTokenQuery,
      PasswordResetTokenCheckReadModel
    >(new CheckPasswordResetTokenQuery(request.token));
  }

  @Post("reset-password/confirm")
  @HttpCode(204)
  public async confirmPasswordReset(
    @Body() request: ConfirmPasswordResetRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new ConfirmPasswordResetCommand(request.token, request.newPassword),
    );
  }

  // Route POST parametree: declaree apres toutes les routes POST statiques
  // (`register/*`, `reset-password/*`) pour ne pas risquer de les masquer.
  @Post(":id/avatar")
  @UseInterceptors(FileInterceptor("avatarFile"))
  public async updateAvatar(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_AVATAR_UPLOAD_BYTES }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<UserResponse> {
    const user = await this.commandBus.execute<
      UpdateAvatarCommand,
      UserReadModel
    >(
      new UpdateAvatarCommand(id, {
        buffer: file.buffer,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
      }),
    );

    return this.userPresenter.present(user);
  }
}
