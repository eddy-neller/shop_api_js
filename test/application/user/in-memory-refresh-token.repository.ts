import type { RefreshTokenRepositoryPort } from "@/application/auth/port/refresh-token-repository.port";
import type { RefreshToken } from "@/domain/refresh-token/model/refresh-token.aggregate";
import type { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import { RefreshTokenId } from "@/domain/refresh-token/value-object/refresh-token-id";
import type { UserId } from "@/domain/user/value-object/identity/user-id";

export class InMemoryRefreshTokenRepository
  implements RefreshTokenRepositoryPort
{
  private readonly store = new Map<string, RefreshToken>();
  private counter = 0;

  public get tokens(): RefreshToken[] {
    return [...this.store.values()];
  }

  public nextIdentity(): RefreshTokenId {
    this.counter += 1;
    const suffix = this.counter.toString().padStart(12, "0");

    return RefreshTokenId.fromString(`00000000-0000-4000-8000-${suffix}`);
  }

  public save(token: RefreshToken): Promise<void> {
    this.store.set(token.getId().toString(), token);

    return Promise.resolve();
  }

  public findByHash(hash: RefreshTokenHash): Promise<RefreshToken | null> {
    for (const token of this.store.values()) {
      if (token.toSnapshot().tokenHash === hash.toString()) {
        return Promise.resolve(token);
      }
    }

    return Promise.resolve(null);
  }

  public delete(token: RefreshToken): Promise<void> {
    this.store.delete(token.getId().toString());

    return Promise.resolve();
  }

  public deleteAllForUser(userId: UserId): Promise<void> {
    for (const [id, token] of this.store) {
      if (token.belongsTo(userId)) {
        this.store.delete(id);
      }
    }

    return Promise.resolve();
  }
}
