import { Module } from "@nestjs/common";
import { AccountModule } from "@/infrastructure/nest/modules/account/account.module";
import { AuthModule } from "@/infrastructure/nest/modules/auth/auth.module";
import { CoreModule } from "@/infrastructure/nest/modules/core/core.module";
import { OnboardingModule } from "@/infrastructure/nest/modules/onboarding/onboarding.module";
import { UserManagementModule } from "@/infrastructure/nest/modules/user-management/user-management.module";

@Module({
  imports: [
    CoreModule,
    AuthModule,
    OnboardingModule,
    AccountModule,
    UserManagementModule,
  ],
})
export class AppModule {}
