import { Body, Controller, HttpCode, Post, UseFilters } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import type { AuthTokensReadModel } from "@/application/auth/dto/auth-tokens.read-model";
import { LoginCommand } from "@/application/auth/use-case/command/login/login.command";
import { LogoutCommand } from "@/application/auth/use-case/command/logout/logout.command";
import { RefreshTokenCommand } from "@/application/auth/use-case/command/refresh-token/refresh-token.command";
import { LoginRequest } from "@/presentation/http/auth/dto/login.request";
import { LogoutRequest } from "@/presentation/http/auth/dto/logout.request";
import { RefreshTokenRequest } from "@/presentation/http/auth/dto/refresh-token.request";
import {
  AuthTokensPresenter,
  type AuthTokensResponse,
} from "@/presentation/http/auth/presenter/auth-tokens.response";
import type { AuthenticatedUser } from "@/presentation/http/shared/auth/authenticated-user";
import { CurrentUser } from "@/presentation/http/shared/decorator/current-user.decorator";
import { Public } from "@/presentation/http/shared/decorator/public.decorator";
import { UserDomainExceptionFilter } from "@/presentation/http/shared/filter/user-domain-exception.filter";

@Controller("auth")
@UseFilters(UserDomainExceptionFilter)
export class AuthController {
  public constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  public async login(
    @Body() request: LoginRequest,
  ): Promise<AuthTokensResponse> {
    const tokens = await this.commandBus.execute<
      LoginCommand,
      AuthTokensReadModel
    >(new LoginCommand(request.email, request.password));

    return AuthTokensPresenter.present(tokens);
  }

  @Public()
  @Post("token/refresh")
  @HttpCode(200)
  public async refresh(
    @Body() request: RefreshTokenRequest,
  ): Promise<AuthTokensResponse> {
    const tokens = await this.commandBus.execute<
      RefreshTokenCommand,
      AuthTokensReadModel
    >(new RefreshTokenCommand(request.refreshToken));

    return AuthTokensPresenter.present(tokens);
  }

  @Post("token/invalidate")
  @HttpCode(204)
  public async invalidate(
    @CurrentUser() current: AuthenticatedUser,
    @Body() request: LogoutRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new LogoutCommand(current.id, request.refreshToken),
    );
  }
}
