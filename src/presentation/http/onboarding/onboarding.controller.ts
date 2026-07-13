import { Body, Controller, HttpCode, Post, UseFilters } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { RegisterUserCommand } from "@/application/onboarding/use-case/command/register-user/register-user.command";
import { RequestActivationEmailCommand } from "@/application/onboarding/use-case/command/request-activation-email/request-activation-email.command";
import { ValidateActivationCommand } from "@/application/onboarding/use-case/command/validate-activation/validate-activation.command";
import type { UserReadModel } from "@/application/shared/dto/user-read-model";
import { RegisterUserRequest } from "@/presentation/http/onboarding/dto/register-user.request";
import { RequestActivationEmailRequest } from "@/presentation/http/onboarding/dto/request-activation-email.request";
import { ValidateActivationRequest } from "@/presentation/http/onboarding/dto/validate-activation.request";
import { Public } from "@/presentation/http/shared/decorator/public.decorator";
import { UserDomainExceptionFilter } from "@/presentation/http/shared/filter/user-domain-exception.filter";
import {
  UserPresenter,
  type UserResponse,
} from "@/presentation/http/shared/presenter/user.response";

@Controller("users")
@UseFilters(UserDomainExceptionFilter)
export class OnboardingController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly userPresenter: UserPresenter,
  ) {}

  @Public()
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

  @Public()
  @Post("register/email-activation-request")
  @HttpCode(204)
  public async requestActivationEmail(
    @Body() request: RequestActivationEmailRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new RequestActivationEmailCommand(request.email),
    );
  }

  @Public()
  @Post("register/validation")
  @HttpCode(204)
  public async validateActivation(
    @Body() request: ValidateActivationRequest,
  ): Promise<void> {
    await this.commandBus.execute(new ValidateActivationCommand(request.token));
  }
}
