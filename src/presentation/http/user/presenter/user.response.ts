import type { UserReadModel } from '@/application/user/dto/user-read-model';

export type UserResponse = {
  id: string;
  email: string;
  roles: string[];
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export class UserPresenter {
  public static present(user: UserReadModel): UserResponse {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
