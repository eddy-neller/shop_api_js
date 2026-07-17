import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { UpdateAvatarCommand } from "@/application/account/use-case/command/update-avatar/update-avatar.command";
import { UpdatePasswordCommand } from "@/application/account/use-case/command/update-password/update-password.command";
import type { UserReadModel } from "@/application/shared/dto/user-read-model";
import { DisplayUserQuery } from "@/application/account/use-case/query/display-user/display-user.query";
import { UpdatePasswordRequest } from "@/presentation/http/account/dto/update-password.request";
import type { AuthenticatedUser } from "@/presentation/http/shared/auth/authenticated-user";
import { CurrentUser } from "@/presentation/http/shared/decorator/current-user.decorator";
import { UserDomainExceptionFilter } from "@/presentation/http/shared/filter/user-domain-exception.filter";
import {
  UserPresenter,
  type UserResponse,
} from "@/presentation/http/shared/presenter/user.response";

@Controller("users/me")
@UseFilters(UserDomainExceptionFilter)
export class MeController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly userPresenter: UserPresenter,
  ) {}

  @Get()
  public async me(
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<UserResponse> {
    const user = await this.queryBus.execute<DisplayUserQuery, UserReadModel>(
      new DisplayUserQuery(current.id),
    );

    return this.userPresenter.present(user);
  }

  @Patch("password")
  @HttpCode(204)
  public async updatePassword(
    @CurrentUser() current: AuthenticatedUser,
    @Body() request: UpdatePasswordRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdatePasswordCommand(
        current.id,
        request.currentPassword,
        request.newPassword,
      ),
    );
  }

  @Post("avatar")
  @UseInterceptors(FileInterceptor("avatarFile"))
  public async updateAvatar(
    @CurrentUser() current: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 3 * 1024 * 1024 }),
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
      new UpdateAvatarCommand(current.id, {
        buffer: file.buffer,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
      }),
    );

    return this.userPresenter.present(user);
  }
}
