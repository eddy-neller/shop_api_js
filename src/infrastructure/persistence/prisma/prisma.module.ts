import { Module } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
