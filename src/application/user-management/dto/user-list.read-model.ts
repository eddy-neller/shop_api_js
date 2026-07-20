import type { UserReadModel } from '@/application/shared/dto/user-read-model';

export type UserListReadModel = {
  items: UserReadModel[];
  totalItems: number;
  totalPages: number;
};
