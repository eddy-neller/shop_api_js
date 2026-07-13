import type { RefreshTokenHasherPort } from "@/application/auth/port/refresh-token-hasher.port";
import type { RefreshTokenRepositoryPort } from "@/application/auth/port/refresh-token-repository.port";
import type { LogoutCommand } from "@/application/auth/use-case/command/logout/logout.command";
import { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import { UserId } from "@/domain/user/value-object/identity/user-id";

export class LogoutUseCase {
  public constructor(
    private readonly refreshTokens: RefreshTokenRepositoryPort,
    private readonly refreshTokenHasher: RefreshTokenHasherPort,
  ) {}

  public async execute(command: LogoutCommand): Promise<void> {
    // Idempotent: revoquer un token absent ou deja revoque ne leve pas d'erreur.
    const userId = UserId.fromString(command.userId);
    const hash = RefreshTokenHash.fromString(
      this.refreshTokenHasher.hash(command.refreshToken),
    );
    const storedToken = await this.refreshTokens.findByHash(hash);

    if (storedToken !== null && storedToken.belongsTo(userId)) {
      await this.refreshTokens.delete(storedToken);
    }
  }
}
