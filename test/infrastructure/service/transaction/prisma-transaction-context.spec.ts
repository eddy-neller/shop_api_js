import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";

describe("PrismaTransactionContext", () => {
  it("exposes the transaction client only during the callback", async () => {
    const context = new PrismaTransactionContext();
    const client = { user: {} } as unknown as Prisma.TransactionClient;

    expect(context.getClient()).toBeUndefined();

    const clientInCallback = await context.run(client, () =>
      Promise.resolve(context.getClient()),
    );

    expect(clientInCallback).toBe(client);
    expect(context.getClient()).toBeUndefined();
  });
});
