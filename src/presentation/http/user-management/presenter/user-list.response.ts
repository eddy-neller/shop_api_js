import { Inject, Injectable } from "@nestjs/common";
import {
  AVATAR_URL_RESOLVER,
  type AvatarUrlResolverPort,
} from "@/application/account/port/avatar-url-resolver.port";
import type { UserReadModel } from "@/application/shared/dto/user-read-model";

export type UserListItemResponse = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  username: string;
  email: string;
  roles: string[];
  status: number;
  avatarUrl: string | null;
  lastVisit: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class UserListPresenter {
  public constructor(
    @Inject(AVATAR_URL_RESOLVER)
    private readonly avatarUrlResolver: AvatarUrlResolverPort,
  ) {}

  public present(items: UserReadModel[]): UserListItemResponse[] {
    return items.map((item) => ({
      id: item.id,
      firstname: item.firstname,
      lastname: item.lastname,
      username: item.username,
      email: item.email,
      roles: item.roles,
      status: item.status,
      avatarUrl: this.avatarUrlResolver.resolve(item.avatarName),
      lastVisit: item.lastVisit,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }
}
