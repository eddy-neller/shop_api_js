import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (connectionString === undefined || connectionString.trim() === '') {
      throw new Error('DATABASE_URL must be defined.');
    }

    super({
      adapter: new PrismaPg({ connectionString })
    });
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
