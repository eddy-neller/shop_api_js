import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";
import { PrismaTransactional } from "@/infrastructure/persistence/prisma/transaction/prisma-transactional";

type TransactionCallback<T> = (
  client: Prisma.TransactionClient,
) => Promise<T>;

function makePrismaService(
  client: Prisma.TransactionClient,
  calls: { count: number },
): PrismaService {
  return {
    $transaction: <T>(callback: TransactionCallback<T>) => {
      calls.count += 1;

      return callback(client);
    },
  } as unknown as PrismaService;
}

describe("PrismaTransactional", () => {
  it("opens a Prisma transaction when no transaction is active", async () => {
    const context = new PrismaTransactionContext();
    const transactionClient = { user: {} } as unknown as Prisma.TransactionClient;
    const calls = { count: 0 };
    const transactional = new PrismaTransactional(
      makePrismaService(transactionClient, calls),
      context,
    );

    const clientInCallback = await transactional.execute(() =>
      Promise.resolve(context.getClient()),
    );

    expect(calls.count).toBe(1);
    expect(clientInCallback).toBe(transactionClient);
    expect(context.getClient()).toBeUndefined();
  });

  it("reuses the active transaction instead of opening a nested one", async () => {
    const context = new PrismaTransactionContext();
    const transactionClient = { user: {} } as unknown as Prisma.TransactionClient;
    const calls = { count: 0 };
    const transactional = new PrismaTransactional(
      makePrismaService(transactionClient, calls),
      context,
    );

    const result = await context.run(transactionClient, () =>
      transactional.execute(() => Promise.resolve("ok")),
    );

    expect(result).toBe("ok");
    expect(calls.count).toBe(0);
  });
});
