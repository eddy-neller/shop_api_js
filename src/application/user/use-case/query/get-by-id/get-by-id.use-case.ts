import { UserId } from "@/domain/user/value-object/user-id";
import { toUserReadModel } from "@/application/user/dto/user-read-model.mapper";
import type { UserReadModel } from "@/application/user/dto/user-read-model";
import type { UserRepositoryPort } from "@/application/user/port/user-repository.port";
import type { GetUserByIdQuery } from "@/application/user/use-case/query/get-by-id/get-by-id.query";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";

export class GetUserByIdUseCase {
  public constructor(private readonly users: UserRepositoryPort) {}

  public async execute(query: GetUserByIdQuery): Promise<UserReadModel> {
    const userId = UserId.fromString(query.id);
    const user = await this.users.findById(userId);

    if (user === null) {
      throw new UserNotFoundException(query.id);
    }

    return toUserReadModel(user);
  }
}
