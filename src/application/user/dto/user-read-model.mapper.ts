import type { User } from '@/domain/user/model/user.aggregate';
import type { UserReadModel } from '@/application/user/dto/user-read-model';

export function toUserReadModel(
  user: User,
  avatarUrl: string | null = null,
): UserReadModel {
  const snapshot = user.toSnapshot();

  return {
    id: snapshot.id,
    email: snapshot.email,
    roles: snapshot.roles,
    avatarUrl,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString()
  };
}
