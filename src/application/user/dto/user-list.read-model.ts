import type { UserReadModel } from '@/application/user/dto/user-read-model';

export type UserListReadModel = {
  items: UserReadModel[];
  totalItems: number;
  totalPages: number;
  page: number;
  itemsPerPage: number;
};
