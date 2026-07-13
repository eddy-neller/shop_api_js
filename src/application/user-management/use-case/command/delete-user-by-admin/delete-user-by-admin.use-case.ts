import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { DeleteUserByAdminCommand } from "@/application/user-management/use-case/command/delete-user-by-admin/delete-user-by-admin.command";
import type { UserRepositoryPort } from "@/application/shared/port/user-repository.port";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { UserId } from "@/domain/user/value-object/identity/user-id";

export class DeleteUserByAdminUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(command: DeleteUserByAdminCommand): Promise<void> {
    const userId = UserId.fromString(command.userId);
    const user = await this.users.findById(userId);

    if (user === null) {
      throw new UserNotFoundException(command.userId);
    }

    await this.transactional.execute(async () => {
      user.deleteByAdmin(this.clock.now());

      await this.users.delete(user);
    });
  }
}
