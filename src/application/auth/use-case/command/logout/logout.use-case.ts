import type { RefreshTokenHasherPort } from "@/application/auth/port/refresh-token-hasher.port";
import type { RefreshTokenRepositoryPort } from "@/application/auth/port/refresh-token-repository.port";
import type { LogoutCommand } from "@/application/auth/use-case/command/logout/logout.command";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import { RefreshTokenHash } from "@/domain/refresh-token/value-object/refresh-token-hash";
import { UserId } from "@/domain/user/value-object/identity/user-id";

export class LogoutUseCase {
  public constructor(
    private readonly refreshTokens: RefreshTokenRepositoryPort,
    private readonly refreshTokenHasher: RefreshTokenHasherPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(command: LogoutCommand): Promise<void> {
    const userId = UserId.fromString(command.userId);
    const hash = RefreshTokenHash.fromString(
      this.refreshTokenHasher.hash(command.refreshToken),
    );

    await this.transactional.execute(async () => {
      const storedToken = await this.refreshTokens.findByHash(hash);

      if (storedToken !== null && storedToken.belongsTo(userId)) {
        await this.refreshTokens.delete(storedToken);
      }
    });
  }
}
