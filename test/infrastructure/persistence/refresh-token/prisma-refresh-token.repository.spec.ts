import { describe, expect, it } from "vitest";
import type { IdGeneratorPort } from "@/application/shared/port/id-generator.port";
import { RefreshToken } from "@/domain/refresh-token/model/refresh-token.aggregate";
import { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import { UserId } from "@/domain/user/value-object/identity/user-id";
import type { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";
import { PrismaRefreshTokenRepository } from "@/infrastructure/persistence/refresh-token/prisma-refresh-token.repository";

const TOKEN_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "11111111-1111-4111-8111-111111111111";
const EXPIRES_AT = new Date("2026-07-22T12:00:00.000Z");
const CREATED_AT = new Date("2026-06-22T12:00:00.000Z");

const idGenerator: IdGeneratorPort = {
  generate: () => TOKEN_ID,
};

type CreateData = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

function makeToken(): RefreshToken {
  return RefreshToken.fromSnapshot({
    id: TOKEN_ID,
    userId: USER_ID,
    tokenHash: "hashed-token",
    expiresAt: EXPIRES_AT,
    createdAt: CREATED_AT,
  });
}

describe("PrismaRefreshTokenRepository", () => {
  it("derives the next identity from the id generator", () => {
    const repository = new PrismaRefreshTokenRepository(
      {} as unknown as PrismaService,
      new PrismaTransactionContext(),
      idGenerator,
    );

    expect(repository.nextIdentity().toString()).toBe(TOKEN_ID);
  });

  it("persists the aggregate through the mapper without the raw secret", async () => {
    const holder: { data: CreateData | null } = { data: null };
    const client = {
      refreshToken: {
        create: (args: { data: CreateData }) => {
          holder.data = args.data;

          return Promise.resolve(null);
        },
      },
    } as unknown as PrismaService;

    const repository = new PrismaRefreshTokenRepository(
      client,
      new PrismaTransactionContext(),
      idGenerator,
    );

    await repository.save(makeToken());

    expect(holder.data).toEqual({
      id: TOKEN_ID,
      userId: USER_ID,
      tokenHash: "hashed-token",
      expiresAt: EXPIRES_AT,
    });
  });

  it("looks up by hash and maps the record back to the aggregate", async () => {
    const client = {
      refreshToken: {
        findUnique: (args: { where: { tokenHash: string } }) => {
          expect(args.where.tokenHash).toBe("hashed-token");

          return Promise.resolve({
            id: TOKEN_ID,
            userId: USER_ID,
            tokenHash: "hashed-token",
            expiresAt: EXPIRES_AT,
            createdAt: CREATED_AT,
          });
        },
      },
    } as unknown as PrismaService;

    const repository = new PrismaRefreshTokenRepository(
      client,
      new PrismaTransactionContext(),
      idGenerator,
    );

    const token = await repository.findByHash(
      RefreshTokenHash.fromString("hashed-token"),
    );

    expect(token?.getId().toString()).toBe(TOKEN_ID);
    expect(token?.belongsTo(UserId.fromString(USER_ID))).toBe(true);
    expect(token?.getExpiresAt()).toEqual(EXPIRES_AT);
  });

  it("deletes a token by its identity", async () => {
    const holder: { where: { id: string } | null } = { where: null };
    const client = {
      refreshToken: {
        deleteMany: (args: { where: { id: string } }) => {
          holder.where = args.where;

          return Promise.resolve({ count: 1 });
        },
      },
    } as unknown as PrismaService;

    const repository = new PrismaRefreshTokenRepository(
      client,
      new PrismaTransactionContext(),
      idGenerator,
    );

    await repository.delete(makeToken());

    expect(holder.where).toEqual({ id: TOKEN_ID });
  });
});
