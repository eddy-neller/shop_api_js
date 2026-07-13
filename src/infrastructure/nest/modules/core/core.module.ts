import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { coreProviders } from "@/infrastructure/nest/modules/core/core.providers";
import { PrismaModule } from "@/infrastructure/persistence/prisma/prisma.module";
import { DomainExceptionFilter } from "@/presentation/http/shared/filter/domain-exception.filter";
import { JwtAuthGuard } from "@/presentation/http/shared/guard/jwt-auth.guard";
import { RolesGuard } from "@/presentation/http/shared/guard/roles.guard";
import { UserDomainExceptionFilter } from "@/presentation/http/shared/filter/user-domain-exception.filter";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    CqrsModule,
    JwtModule.register({}),
    PrismaModule,
  ],
  providers: [
    UserDomainExceptionFilter,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    ...coreProviders,
  ],
  exports: [
    ConfigModule,
    CqrsModule,
    JwtModule,
    PrismaModule,
    UserDomainExceptionFilter,
    ...coreProviders,
  ],
})
export class CoreModule {}
