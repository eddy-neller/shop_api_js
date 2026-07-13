import { Module } from "@nestjs/common";
import {
  accountCqrsHandlers,
  accountPortProviders,
  accountUseCaseProviders,
} from "@/infrastructure/nest/modules/account/account.providers";
import { CoreModule } from "@/infrastructure/nest/modules/core/core.module";
import { AccountRecoveryController } from "@/presentation/http/account/account-recovery.controller";
import { MeController } from "@/presentation/http/account/me.controller";
import { UserPresenter } from "@/presentation/http/shared/presenter/user.response";

@Module({
  imports: [CoreModule],
  controllers: [MeController, AccountRecoveryController],
  providers: [
    UserPresenter,
    ...accountCqrsHandlers,
    ...accountUseCaseProviders,
    ...accountPortProviders,
  ],
})
export class AccountModule {}
