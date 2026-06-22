import { Module } from "@nestjs/common";
import { UserModule } from "@/infrastructure/nest/user/user.module";
import { ConfigModule } from "@nestjs/config/dist/config.module";

@Module({
  imports: [UserModule, ConfigModule.forRoot()],
})
export class AppModule {}
