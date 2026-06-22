import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import {
  userCqrsHandlers,
  userPortProviders,
  userUseCaseProviders,
} from "@/infrastructure/nest/user/user.providers";
import { PrismaModule } from "@/infrastructure/persistence/prisma/prisma.module";
import { UserDomainExceptionFilter } from "@/presentation/http/user/filter/user-domain-exception.filter";
import { UserController } from "@/presentation/http/user/user.controller";

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [UserController],
  providers: [
    UserDomainExceptionFilter,
    ...userCqrsHandlers,
    ...userUseCaseProviders,
    ...userPortProviders,
  ],
})
export class UserModule {}
