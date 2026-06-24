import type { User } from '@/domain/user/model/user.aggregate';
import type { Email } from '@/domain/user/value-object/email';
import type { UserId } from '@/domain/user/value-object/user-id';
import type { Username } from '@/domain/user/value-object/username';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  nextIdentity(): UserId;
  save(user: User): Promise<void>;
  delete(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByUsername(username: Username): Promise<User | null>;
  findByActivationToken(token: string): Promise<User | null>;
  findByResetPasswordToken(token: string): Promise<User | null>;
}
