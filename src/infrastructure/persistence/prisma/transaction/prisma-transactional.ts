import { Injectable } from "@nestjs/common";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";

@Injectable()
export class PrismaTransactional implements TransactionalPort {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly context: PrismaTransactionContext,
  ) {}

  public execute<T>(callback: () => Promise<T>): Promise<T> {
    const currentClient = this.context.getClient();

    if (currentClient !== undefined) {
      return callback();
    }

    return this.prisma.$transaction((client) =>
      this.context.run(client, callback),
    );
  }
}
