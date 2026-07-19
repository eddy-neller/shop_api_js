import { Module } from "@nestjs/common";
import {
  authCqrsHandlers,
  authPortProviders,
  authServiceProviders,
  authUseCaseProviders,
} from "@/infrastructure/nest/modules/auth/auth.providers";
import { CoreModule } from "@/infrastructure/nest/modules/core/core.module";
import { AuthController } from "@/presentation/http/auth/auth.controller";

@Module({
  imports: [CoreModule],
  controllers: [AuthController],
  providers: [
    ...authCqrsHandlers,
    ...authUseCaseProviders,
    ...authServiceProviders,
    ...authPortProviders,
  ],
})
export class AuthModule {}
