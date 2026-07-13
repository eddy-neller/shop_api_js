import type {
  UserListCriteria,
  UserListResult,
  UserRepositoryPort,
} from '@/application/shared/port/user-repository.port';
import type { User } from '@/domain/user/model/user.aggregate';
import type { Email } from '@/domain/user/value-object/identity/email';
import { UserId } from '@/domain/user/value-object/identity/user-id';
import type { Username } from '@/domain/user/value-object/identity/username';

export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();

  public constructor(
    private readonly nextId = '11111111-1111-4111-8111-111111111111',
  ) {}

  public nextIdentity(): UserId {
    return UserId.fromString(this.nextId);
  }

  public save(user: User): Promise<void> {
    this.users.set(user.toSnapshot().id, user);

    return Promise.resolve();
  }

  public delete(user: User): Promise<void> {
    this.users.delete(user.toSnapshot().id);

    return Promise.resolve();
  }

  public findById(id: UserId): Promise<User | null> {
    return Promise.resolve(this.users.get(id.toString()) ?? null);
  }

  public findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.toSnapshot().email === email.toString()) {
        return Promise.resolve(user);
      }
    }

    return Promise.resolve(null);
  }

  public findByUsername(username: Username): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.toSnapshot().username === username.toString()) {
        return Promise.resolve(user);
      }
    }

    return Promise.resolve(null);
  }

  public findByActivationToken(token: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.toSnapshot().activeEmail.token === token) {
        return Promise.resolve(user);
      }
    }

    return Promise.resolve(null);
  }

  public findByResetPasswordToken(token: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.toSnapshot().resetPassword.token === token) {
        return Promise.resolve(user);
      }
    }

    return Promise.resolve(null);
  }

  public list(criteria: UserListCriteria): Promise<UserListResult> {
    let users = Array.from(this.users.values());

    const { username, email } = criteria.filters;
    if (username !== undefined) {
      const needle = username.toLowerCase();
      users = users.filter((user) =>
        user.toSnapshot().username.toLowerCase().includes(needle),
      );
    }
    if (email !== undefined) {
      const needle = email.toLowerCase();
      users = users.filter((user) =>
        user.toSnapshot().email.toLowerCase().includes(needle),
      );
    }

    const { field, direction } = criteria.orderBy;
    users.sort((a, b) => {
      const left = this.sortValue(a, field);
      const right = this.sortValue(b, field);
      const comparison = left < right ? -1 : left > right ? 1 : 0;
      return direction === 'ASC' ? comparison : -comparison;
    });

    const totalItems = users.length;
    const totalPages = Math.ceil(totalItems / criteria.itemsPerPage);
    const start = (criteria.page - 1) * criteria.itemsPerPage;
    const paged = users.slice(start, start + criteria.itemsPerPage);

    return Promise.resolve({ users: paged, totalItems, totalPages });
  }

  private sortValue(user: User, field: UserListCriteria['orderBy']['field']): string | number {
    const snapshot = user.toSnapshot();

    if (field === 'createdAt') {
      return snapshot.createdAt.getTime();
    }

    return snapshot[field];
  }
}
