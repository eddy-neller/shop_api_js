import { join } from "node:path";
import { HttpStatus, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "@/infrastructure/nest/app.module";
import {
  createCorsOptions,
  parseCorsOriginRegex,
} from "@/infrastructure/nest/cors/cors-options";
import { setAvatarSecurityHeaders } from "@/infrastructure/nest/security/avatar-security-headers";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  app.enableCors(
    createCorsOptions(parseCorsOriginRegex(process.env.CORS_ORIGIN_REGEX)),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  app.useStaticAssets(join(process.cwd(), process.env.AVATAR_UPLOAD_DIR!), {
    prefix: process.env.AVATAR_BASE_URL,
    setHeaders: setAvatarSecurityHeaders,
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
