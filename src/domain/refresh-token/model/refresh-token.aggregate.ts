import { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import { RefreshTokenId } from "@/domain/refresh-token/value-object/refresh-token-id";
import { UserDomainException } from "@/domain/user/exception/user-domain-exception";
import { UserId } from "@/domain/user/value-object/identity/user-id";

export type RefreshTokenSnapshot = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export class RefreshToken {
  private constructor(
    private readonly id: RefreshTokenId,
    private readonly userId: UserId,
    private readonly tokenHash: RefreshTokenHash,
    private readonly expiresAt: Date,
    private readonly createdAt: Date,
  ) {}

  public static issue(params: {
    id: RefreshTokenId;
    userId: UserId;
    tokenHash: RefreshTokenHash;
    expiresAt: Date;
    now: Date;
  }): RefreshToken {
    if (params.expiresAt.getTime() <= params.now.getTime()) {
      throw new UserDomainException(
        "A refresh token must expire in the future.",
      );
    }

    return new RefreshToken(
      params.id,
      params.userId,
      params.tokenHash,
      params.expiresAt,
      params.now,
    );
  }

  public static fromSnapshot(snapshot: RefreshTokenSnapshot): RefreshToken {
    return new RefreshToken(
      RefreshTokenId.fromString(snapshot.id),
      UserId.fromString(snapshot.userId),
      RefreshTokenHash.fromString(snapshot.tokenHash),
      snapshot.expiresAt,
      snapshot.createdAt,
    );
  }

  public toSnapshot(): RefreshTokenSnapshot {
    return {
      id: this.id.toString(),
      userId: this.userId.toString(),
      tokenHash: this.tokenHash.toString(),
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
    };
  }

  public isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  public belongsTo(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  public getId(): RefreshTokenId {
    return this.id;
  }

  public getUserId(): UserId {
    return this.userId;
  }

  public getExpiresAt(): Date {
    return this.expiresAt;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }
}
