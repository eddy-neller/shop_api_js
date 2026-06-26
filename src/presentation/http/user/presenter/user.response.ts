import { Inject, Injectable } from "@nestjs/common";
import {
  AVATAR_URL_RESOLVER,
  type AvatarUrlResolverPort,
} from "@/application/user/port/avatar-url-resolver.port";
import type { UserReadModel } from "@/application/user/dto/user-read-model";

export type UserResponse = {
  id: string;
  email: string;
  roles: string[];
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class UserPresenter {
  public constructor(
    @Inject(AVATAR_URL_RESOLVER)
    private readonly avatarUrlResolver: AvatarUrlResolverPort,
  ) {}

  public present(user: UserReadModel): UserResponse {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      avatarUrl: this.avatarUrlResolver.resolve(user.avatarName),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
