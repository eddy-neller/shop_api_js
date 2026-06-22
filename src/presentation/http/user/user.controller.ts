import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseFilters,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ConfirmPasswordResetCommand } from "@/application/user/use-case/command/confirm-password-reset/confirm-password-reset.command";
import { RegisterUserCommand } from "@/application/user/use-case/command/register/register.command";
import { RequestActivationEmailCommand } from "@/application/user/use-case/command/request-activation-email/request-activation-email.command";
import { RequestPasswordResetCommand } from "@/application/user/use-case/command/request-password-reset/request-password-reset.command";
import { ValidateActivationCommand } from "@/application/user/use-case/command/validate-activation/validate-activation.command";
import type { UserReadModel } from "@/application/user/dto/user-read-model";
import { GetUserByIdQuery } from "@/application/user/use-case/query/get-by-id/get-by-id.query";
import { ConfirmPasswordResetRequest } from "@/presentation/http/user/dto/confirm-password-reset.request";
import { RegisterUserRequest } from "@/presentation/http/user/dto/register.request";
import { RequestActivationEmailRequest } from "@/presentation/http/user/dto/request-activation-email.request";
import { RequestPasswordResetRequest } from "@/presentation/http/user/dto/request-password-reset.request";
import { ValidateActivationRequest } from "@/presentation/http/user/dto/validate-activation.request";
import { FindOneParams } from "@/presentation/http/user/dto/getbyid.request";
import { UserDomainExceptionFilter } from "@/presentation/http/user/filter/user-domain-exception.filter";
import {
  UserPresenter,
  type UserResponse,
} from "@/presentation/http/user/presenter/user.response";

@Controller("users")
@UseFilters(UserDomainExceptionFilter)
export class UserController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

    return UserPresenter.present(user);
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

  @Post("reset-password/confirm")
  @HttpCode(204)
  public async confirmPasswordReset(
    @Body() request: ConfirmPasswordResetRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new ConfirmPasswordResetCommand(request.token, request.newPassword),
    );
  }

  @Get(":id")
  public async getById(@Param() params: FindOneParams): Promise<UserResponse> {
    const user = await this.queryBus.execute<GetUserByIdQuery, UserReadModel>(
      new GetUserByIdQuery(params.id),
    );

    return UserPresenter.present(user);
  }
}
