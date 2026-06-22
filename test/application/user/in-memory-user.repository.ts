import type { UserRepositoryPort } from '@/application/user/port/user-repository.port';
import type { User } from '@/domain/user/model/user.aggregate';
import type { Email } from '@/domain/user/value-object/email';
import type { UserId } from '@/domain/user/value-object/user-id';
import type { Username } from '@/domain/user/value-object/username';

export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();

  public save(user: User): Promise<void> {
    this.users.set(user.toSnapshot().id, user);

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
}
