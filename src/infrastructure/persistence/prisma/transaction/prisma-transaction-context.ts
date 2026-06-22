import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

@Injectable()
export class PrismaTransactionContext {
  private readonly storage = new AsyncLocalStorage<Prisma.TransactionClient>();

  public getClient(): Prisma.TransactionClient | undefined {
    return this.storage.getStore();
  }

  public run<T>(
    client: Prisma.TransactionClient,
    callback: () => Promise<T>,
  ): Promise<T> {
    return this.storage.run(client, callback);
  }
}
