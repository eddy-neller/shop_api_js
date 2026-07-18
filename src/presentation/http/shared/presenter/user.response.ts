import { Inject, Injectable } from "@nestjs/common";
import {
  AVATAR_URL_RESOLVER,
  type AvatarUrlResolverPort,
} from "@/application/account/port/avatar-url-resolver.port";
import type { UserReadModel } from "@/application/shared/dto/user-read-model";

export type UserResponse = {
  id: string;
  firstname: string | null,
  lastname: string | null,
  username: string,
  email: string;
  roles: string[];
  status: number;
  avatarUrl: string | null;
  lastVisit: string,
  nbLogin: number,
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
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      email: user.email,
      roles: user.roles,
      status: user.status,
      avatarUrl: this.avatarUrlResolver.resolve(user.avatarName),
      lastVisit: user.lastVisit,
      nbLogin: user.loginCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
