import { Prisma } from "@prisma/client";
import type { IdGeneratorPort } from "@/application/user/port/id-generator.port";
import type { UserRepositoryPort } from "@/application/user/port/user-repository.port";
import type { User } from "@/domain/user/model/user.aggregate";
import type { Email } from "@/domain/user/value-object/email";
import { UserId } from "@/domain/user/value-object/user-id";
import type { Username } from "@/domain/user/value-object/username";
import type { PrismaService } from "@/infrastructure/persistence/prisma/prisma.service";
import type { PrismaTransactionContext } from "@/infrastructure/persistence/prisma/transaction/prisma-transaction-context";
import { UserMapper } from "@/infrastructure/persistence/user/user.mapper";

export class PrismaUserRepository implements UserRepositoryPort {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly transactionContext: PrismaTransactionContext,
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  public nextIdentity(): UserId {
    return UserId.fromString(this.idGenerator.generate());
  }

  public async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    const client = this.client();

    await client.user.upsert({
      where: { id: data.id },
      create: data,
      update: {
        firstname: data.firstname,
        lastname: data.lastname,
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        roles: data.roles,
        status: data.status,
        security: data.security,
        activeEmail: data.activeEmail,
        resetPassword: data.resetPassword,
        preferences: data.preferences,
        avatarName: data.avatarName,
        lastVisit: data.lastVisit,
        nbLogin: data.nbLogin,
        updatedAt: data.updatedAt,
      },
    });
  }

  public async delete(user: User): Promise<void> {
    const id = user.toSnapshot().id;

    await this.client().user.delete({
      where: { id },
    });
  }

  public async findById(id: UserId): Promise<User | null> {
    const record = await this.client().user.findUnique({
      where: { id: id.toString() },
    });

    return record === null ? null : UserMapper.toDomain(record);
  }

  public async findByEmail(email: Email): Promise<User | null> {
    const record = await this.client().user.findUnique({
      where: { email: email.toString() },
    });

    return record === null ? null : UserMapper.toDomain(record);
  }

  public async findByUsername(username: Username): Promise<User | null> {
    const record = await this.client().user.findFirst({
      where: { username: username.toString() },
    });

    return record === null ? null : UserMapper.toDomain(record);
  }

  public async findByActivationToken(token: string): Promise<User | null> {
    const record = await this.client().user.findFirst({
      where: {
        activeEmail: {
          path: ["token"],
          equals: token,
        },
      },
    });

    return record === null ? null : UserMapper.toDomain(record);
  }

  public async findByResetPasswordToken(token: string): Promise<User | null> {
    const record = await this.client().user.findFirst({
      where: {
        resetPassword: {
          path: ["token"],
          equals: token,
        },
      },
    });

    return record === null ? null : UserMapper.toDomain(record);
  }

  public isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }

  private client(): Prisma.TransactionClient | PrismaService {
    return this.transactionContext.getClient() ?? this.prisma;
  }
}
