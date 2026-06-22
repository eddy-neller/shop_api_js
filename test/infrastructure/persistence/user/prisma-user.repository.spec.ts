import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { Email } from "@/domain/user/value-object/email";
import type { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import { PrismaUserRepository } from "@/infrastructure/persistence/user/prisma-user.repository";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";

type ClientName = "root" | "transaction";

type RepositoryCall = {
  client: ClientName;
  operation: "findUnique";
};

function makeClient(
  client: ClientName,
  calls: RepositoryCall[],
): Prisma.TransactionClient {
  return {
    user: {
      findUnique: () => {
        calls.push({ client, operation: "findUnique" });

        return Promise.resolve(null);
      },
    },
  } as unknown as Prisma.TransactionClient;
}

describe("PrismaUserRepository", () => {
  it("uses PrismaService when no transaction is active", async () => {
    const calls: RepositoryCall[] = [];
    const context = new PrismaTransactionContext();
    const repository = new PrismaUserRepository(
      makeClient("root", calls) as unknown as PrismaService,
      context,
    );

    await repository.findByEmail(Email.fromString("john@example.com"));

    expect(calls).toEqual([{ client: "root", operation: "findUnique" }]);
  });

  it("uses the active transaction client when one exists", async () => {
    const calls: RepositoryCall[] = [];
    const context = new PrismaTransactionContext();
    const repository = new PrismaUserRepository(
      makeClient("root", calls) as unknown as PrismaService,
      context,
    );
    const transactionClient = makeClient("transaction", calls);

    await context.run(transactionClient, () =>
      repository.findByEmail(Email.fromString("john@example.com")),
    );

    expect(calls).toEqual([
      { client: "transaction", operation: "findUnique" },
    ]);
  });
});
