import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { IdGeneratorPort } from "@/application/user/port/id-generator.port";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/email";
import { PasswordHash } from "@/domain/user/value-object/password-hash";
import { Preferences } from "@/domain/user/value-object/preferences";
import { UserId } from "@/domain/user/value-object/user-id";
import { UserRole } from "@/domain/user/value-object/user-role";
import { UserStatus } from "@/domain/user/value-object/user-status";
import { Username } from "@/domain/user/value-object/username";
import type { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import { PrismaUserRepository } from "@/infrastructure/persistence/user/prisma-user.repository";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";

const idGenerator: IdGeneratorPort = {
  generate: () => "11111111-1111-4111-8111-111111111111",
};

type ClientName = "root" | "transaction";

type RepositoryCall = {
  client: ClientName;
  operation: "findUnique" | "delete";
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
      delete: () => {
        calls.push({ client, operation: "delete" });

        return Promise.resolve(null);
      },
    },
  } as unknown as Prisma.TransactionClient;
}

function makeUser(): User {
  return User.createByAdmin({
    id: UserId.fromString("11111111-1111-4111-8111-111111111111"),
    username: Username.fromString("john"),
    email: Email.fromString("john@example.com"),
    passwordHash: PasswordHash.fromString("hashed-password"),
    roles: [UserRole.User],
    status: UserStatus.active(),
    preferences: new Preferences(),
    now: new Date("2026-06-22T12:00:00.000Z"),
  });
}

describe("PrismaUserRepository", () => {
  it("uses PrismaService when no transaction is active", async () => {
    const calls: RepositoryCall[] = [];
    const context = new PrismaTransactionContext();
    const repository = new PrismaUserRepository(
      makeClient("root", calls) as unknown as PrismaService,
      context,
      idGenerator,
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
      idGenerator,
    );
    const transactionClient = makeClient("transaction", calls);

    await context.run(transactionClient, () =>
      repository.findByEmail(Email.fromString("john@example.com")),
    );

    expect(calls).toEqual([
      { client: "transaction", operation: "findUnique" },
    ]);
  });

  it("deletes through the active transaction client when one exists", async () => {
    const calls: RepositoryCall[] = [];
    const context = new PrismaTransactionContext();
    const repository = new PrismaUserRepository(
      makeClient("root", calls) as unknown as PrismaService,
      context,
      idGenerator,
    );
    const transactionClient = makeClient("transaction", calls);

    await context.run(transactionClient, () => repository.delete(makeUser()));

    expect(calls).toEqual([{ client: "transaction", operation: "delete" }]);
  });
});
