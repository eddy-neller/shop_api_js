import type { Provider } from "@nestjs/common";
import { CreateUserByAdminUseCase } from "@/application/user-management/use-case/command/create-user-by-admin/create-user-by-admin.use-case";
import { DeleteUserByAdminUseCase } from "@/application/user-management/use-case/command/delete-user-by-admin/delete-user-by-admin.use-case";
import { UpdateUserByAdminUseCase } from "@/application/user-management/use-case/command/update-user-by-admin/update-user-by-admin.use-case";
import { ListUsersUseCase } from "@/application/user-management/use-case/query/list-users/list-users.use-case";
import { CLOCK, type ClockPort } from "@/application/shared/port/clock.port";
import {
  PASSWORD_HASHER,
  type PasswordHasherPort,
} from "@/application/shared/port/password-hasher.port";
import {
  TRANSACTIONAL,
  type TransactionalPort,
} from "@/application/shared/port/transactional.port";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "@/application/shared/port/user-repository.port";
import {
  USER_UNIQUENESS_CHECKER,
  type UserUniquenessCheckerPort,
} from "@/application/shared/port/user-uniqueness-checker.port";
import { CreateUserByAdminNestCommandHandler } from "@/infrastructure/nest/cqrs/user-management/command/create-user-by-admin.nest-command-handler";
import { DeleteUserByAdminNestCommandHandler } from "@/infrastructure/nest/cqrs/user-management/command/delete-user-by-admin.nest-command-handler";
import { UpdateUserByAdminNestCommandHandler } from "@/infrastructure/nest/cqrs/user-management/command/update-user-by-admin.nest-command-handler";
import { ListUsersNestQueryHandler } from "@/infrastructure/nest/cqrs/user-management/query/list-users.nest-query-handler";

export const userManagementCqrsHandlers: Provider[] = [
  CreateUserByAdminNestCommandHandler,
  UpdateUserByAdminNestCommandHandler,
  DeleteUserByAdminNestCommandHandler,
  ListUsersNestQueryHandler,
];

export const userManagementUseCaseProviders: Provider[] = [
  {
    provide: CreateUserByAdminUseCase,
    useFactory: (
      users: UserRepositoryPort,
      uniquenessChecker: UserUniquenessCheckerPort,
      passwordHasher: PasswordHasherPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) =>
      new CreateUserByAdminUseCase(
        users,
        uniquenessChecker,
        passwordHasher,
        clock,
        transactional,
      ),
    inject: [
      USER_REPOSITORY,
      USER_UNIQUENESS_CHECKER,
      PASSWORD_HASHER,
      CLOCK,
      TRANSACTIONAL,
    ],
  },
  {
    provide: UpdateUserByAdminUseCase,
    useFactory: (
      users: UserRepositoryPort,
      uniquenessChecker: UserUniquenessCheckerPort,
      passwordHasher: PasswordHasherPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) =>
      new UpdateUserByAdminUseCase(
        users,
        uniquenessChecker,
        passwordHasher,
        clock,
        transactional,
      ),
    inject: [
      USER_REPOSITORY,
      USER_UNIQUENESS_CHECKER,
      PASSWORD_HASHER,
      CLOCK,
      TRANSACTIONAL,
    ],
  },
  {
    provide: DeleteUserByAdminUseCase,
    useFactory: (
      users: UserRepositoryPort,
      clock: ClockPort,
      transactional: TransactionalPort,
    ) => new DeleteUserByAdminUseCase(users, clock, transactional),
    inject: [USER_REPOSITORY, CLOCK, TRANSACTIONAL],
  },
  {
    provide: ListUsersUseCase,
    useFactory: (users: UserRepositoryPort) => new ListUsersUseCase(users),
    inject: [USER_REPOSITORY],
  },
];
