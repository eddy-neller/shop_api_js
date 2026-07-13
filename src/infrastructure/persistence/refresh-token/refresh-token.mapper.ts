import type { RefreshToken as PrismaRefreshToken } from "@prisma/client";
import { RefreshToken } from "@/domain/refresh-token/model/refresh-token.aggregate";

export type RefreshTokenPersistence = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export const RefreshTokenMapper = {
  toPersistence(token: RefreshToken): RefreshTokenPersistence {
    const snapshot = token.toSnapshot();

    return {
      id: snapshot.id,
      userId: snapshot.userId,
      tokenHash: snapshot.tokenHash,
      expiresAt: snapshot.expiresAt,
    };
  },

  toDomain(record: PrismaRefreshToken): RefreshToken {
    return RefreshToken.fromSnapshot({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    });
  },
};
