import { Module } from "@nestjs/common";
import { CoreModule } from "@/infrastructure/nest/modules/core/core.module";
import {
  onboardingCqrsHandlers,
  onboardingUseCaseProviders,
} from "@/infrastructure/nest/modules/onboarding/onboarding.providers";
import { OnboardingController } from "@/presentation/http/onboarding/onboarding.controller";
import { UserPresenter } from "@/presentation/http/shared/presenter/user.response";

@Module({
  imports: [CoreModule],
  controllers: [OnboardingController],
  providers: [
    UserPresenter,
    ...onboardingCqrsHandlers,
    ...onboardingUseCaseProviders,
  ],
})
export class OnboardingModule {}
