import type { RefreshToken } from "@/domain/refresh-token/model/refresh-token.aggregate";
import type { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import type { RefreshTokenId } from "@/domain/refresh-token/value-object/refresh-token-id";
import type { UserId } from "@/domain/user/value-object/identity/user-id";

export const REFRESH_TOKEN_REPOSITORY = Symbol("REFRESH_TOKEN_REPOSITORY");

export interface RefreshTokenRepositoryPort {
  nextIdentity(): RefreshTokenId;
  save(token: RefreshToken): Promise<void>;
  findByHash(hash: RefreshTokenHash): Promise<RefreshToken | null>;
  delete(token: RefreshToken): Promise<void>;
  deleteAllForUser(userId: UserId): Promise<void>;
}
