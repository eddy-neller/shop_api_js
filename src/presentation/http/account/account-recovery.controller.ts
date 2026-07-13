import { Body, Controller, HttpCode, Post, UseFilters } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ConfirmPasswordResetCommand } from "@/application/account/use-case/command/confirm-password-reset/confirm-password-reset.command";
import { RequestPasswordResetCommand } from "@/application/account/use-case/command/request-password-reset/request-password-reset.command";
import type { PasswordResetTokenCheckReadModel } from "@/application/account/dto/password-reset-token-check.read-model";
import { CheckPasswordResetTokenQuery } from "@/application/account/use-case/query/check-password-reset-token/check-password-reset-token.query";
import { CheckPasswordResetTokenRequest } from "@/presentation/http/account/dto/check-password-reset-token.request";
import { ConfirmPasswordResetRequest } from "@/presentation/http/account/dto/confirm-password-reset.request";
import { RequestPasswordResetRequest } from "@/presentation/http/account/dto/request-password-reset.request";
import { Public } from "@/presentation/http/shared/decorator/public.decorator";
import { UserDomainExceptionFilter } from "@/presentation/http/shared/filter/user-domain-exception.filter";

@Controller("users")
@UseFilters(UserDomainExceptionFilter)
export class AccountRecoveryController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post("reset-password/request")
  @HttpCode(204)
  public async requestPasswordReset(
    @Body() request: RequestPasswordResetRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new RequestPasswordResetCommand(request.email),
    );
  }

  @Public()
  @Post("reset-password/check")
  public async checkPasswordResetToken(
    @Body() request: CheckPasswordResetTokenRequest,
  ): Promise<PasswordResetTokenCheckReadModel> {
    return this.queryBus.execute<
      CheckPasswordResetTokenQuery,
      PasswordResetTokenCheckReadModel
    >(new CheckPasswordResetTokenQuery(request.token));
  }

  @Public()
  @Post("reset-password/confirm")
  @HttpCode(204)
  public async confirmPasswordReset(
    @Body() request: ConfirmPasswordResetRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new ConfirmPasswordResetCommand(request.token, request.newPassword),
    );
  }
}
