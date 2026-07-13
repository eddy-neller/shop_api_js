import type { Prisma } from "@prisma/client";
import type { IdGeneratorPort } from "@/application/shared/port/id-generator.port";
import type { RefreshTokenRepositoryPort } from "@/application/auth/port/refresh-token-repository.port";
import type { RefreshToken } from "@/domain/refresh-token/model/refresh-token.aggregate";
import type { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import { RefreshTokenId } from "@/domain/refresh-token/value-object/refresh-token-id";
import type { UserId } from "@/domain/user/value-object/identity/user-id";
import type { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import type { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";
import { RefreshTokenMapper } from "@/infrastructure/persistence/refresh-token/refresh-token.mapper";

export class PrismaRefreshTokenRepository
  implements RefreshTokenRepositoryPort
{
  public constructor(
    private readonly prisma: PrismaService,
    private readonly transactionContext: PrismaTransactionContext,
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  public nextIdentity(): RefreshTokenId {
    return RefreshTokenId.fromString(this.idGenerator.generate());
  }

  public async save(token: RefreshToken): Promise<void> {
    const data = RefreshTokenMapper.toPersistence(token);

    await this.client().refreshToken.create({ data });
  }

  public async findByHash(hash: RefreshTokenHash): Promise<RefreshToken | null> {
    const record = await this.client().refreshToken.findUnique({
      where: { tokenHash: hash.toString() },
    });

    return record === null ? null : RefreshTokenMapper.toDomain(record);
  }

  public async delete(token: RefreshToken): Promise<void> {
    await this.client().refreshToken.deleteMany({
      where: { id: token.getId().toString() },
    });
  }

  public async deleteAllForUser(userId: UserId): Promise<void> {
    await this.client().refreshToken.deleteMany({
      where: { userId: userId.toString() },
    });
  }

  private client(): Prisma.TransactionClient | PrismaService {
    return this.transactionContext.getClient() ?? this.prisma;
  }
}
