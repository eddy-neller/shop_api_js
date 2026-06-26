import type { ClockPort } from "@/application/shared/port/clock.port";
import type { TransactionalPort } from "@/application/shared/port/transactional.port";
import type { UpdateAvatarCommand } from "@/application/user/use-case/command/update-avatar/update-avatar.command";
import { UserReadModel } from "@/application/user/dto/user-read-model";
import type { AvatarImageValidatorPort } from "@/application/user/port/avatar-image-validator.port";
import type { AvatarUploaderPort } from "@/application/user/port/avatar-uploader.port";
import type { UserRepositoryPort } from "@/application/user/port/user-repository.port";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { UserId } from "@/domain/user/value-object/user-id";

export class UpdateAvatarUseCase {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly imageValidator: AvatarImageValidatorPort,
    private readonly uploader: AvatarUploaderPort,
    private readonly clock: ClockPort,
    private readonly transactional: TransactionalPort,
  ) {}

  public async execute(command: UpdateAvatarCommand): Promise<UserReadModel> {
    const userId = UserId.fromString(command.userId);
    const user = await this.users.findById(userId);

    if (user === null) {
      throw new UserNotFoundException(command.userId);
    }

    await this.imageValidator.validate(command.file);

    const previousAvatarName = user.getAvatarName();
    const avatarName = await this.uploader.upload(userId, command.file);

    await this.transactional.execute(async () => {
      user.updateAvatar(avatarName, this.clock.now());

      await this.users.save(user);
    });

    if (previousAvatarName !== null && previousAvatarName !== avatarName) {
      await this.uploader.delete(previousAvatarName);
    }

    return UserReadModel.fromUser(user);
  }
}
