import { Module } from "@nestjs/common";
import { CoreModule } from "@/infrastructure/nest/modules/core/core.module";
import {
  userManagementCqrsHandlers,
  userManagementUseCaseProviders,
} from "@/infrastructure/nest/modules/user-management/user-management.providers";
import { UserPresenter } from "@/presentation/http/shared/presenter/user.response";
import { UserManagementController } from "@/presentation/http/user-management/user-management.controller";
import { UserListPresenter } from "@/presentation/http/user-management/presenter/user-list.response";

@Module({
  imports: [CoreModule],
  controllers: [UserManagementController],
  providers: [
    UserPresenter,
    UserListPresenter,
    ...userManagementCqrsHandlers,
    ...userManagementUseCaseProviders,
  ],
})
export class UserManagementModule {}
