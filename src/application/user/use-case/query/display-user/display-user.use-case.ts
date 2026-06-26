import { UserId } from "@/domain/user/value-object/user-id";
import { UserReadModel } from "@/application/user/dto/user-read-model";
import type { UserRepositoryPort } from "@/application/user/port/user-repository.port";
import type { DisplayUserQuery } from "@/application/user/use-case/query/display-user/display-user.query";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";

export class DisplayUserUseCase {
  public constructor(private readonly users: UserRepositoryPort) {}

  public async execute(query: DisplayUserQuery): Promise<UserReadModel> {
    const userId = UserId.fromString(query.id);
    const user = await this.users.findById(userId);

    if (user === null) {
      throw new UserNotFoundException(query.id);
    }

    return UserReadModel.fromUser(user);
  }
}
