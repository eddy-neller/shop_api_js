import type { Prisma } from '@prisma/client';
import { User } from '@/domain/user/model/user.aggregate';
import type { ActiveEmailSnapshot } from '@/domain/user/value-object/identity/active-email';
import type { PreferencesSnapshot } from '@/domain/user/value-object/profile/preferences';
import type { ResetPasswordSnapshot } from '@/domain/user/value-object/security/reset-password';
import type { SecuritySnapshot } from '@/domain/user/value-object/security/security';

type PrismaUser = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  username: string;
  email: string;
  passwordHash: string;
  roles: Prisma.JsonValue;
  status: number;
  security: Prisma.JsonValue;
  activeEmail: Prisma.JsonValue;
  resetPassword: Prisma.JsonValue;
  preferences: Prisma.JsonValue;
  avatarName: string | null;
  lastVisit: Date;
  nbLogin: number;
  createdAt: Date;
  updatedAt: Date;
};

export class UserMapper {
  public static toDomain(record: PrismaUser): User {
    if (!Array.isArray(record.roles) || !record.roles.every((role) => typeof role === 'string')) {
      throw new Error(`Invalid roles stored for user ${record.id}.`);
    }

    return User.fromSnapshot({
      id: record.id,
      firstname: record.firstname,
      lastname: record.lastname,
      username: record.username,
      email: record.email,
      passwordHash: record.passwordHash,
      roles: record.roles,
      status: record.status,
      security: UserMapper.securitySnapshot(record.security, record.id),
      activeEmail: UserMapper.activeEmailSnapshot(record.activeEmail, record.id),
      resetPassword: UserMapper.resetPasswordSnapshot(record.resetPassword, record.id),
      preferences: UserMapper.preferencesSnapshot(record.preferences, record.id),
      avatarName: record.avatarName,
      lastVisit: record.lastVisit,
      nbLogin: record.nbLogin,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }

  public static toPersistence(user: User): Prisma.UserUncheckedCreateInput {
    const snapshot = user.toSnapshot();

    return {
      id: snapshot.id,
      firstname: snapshot.firstname,
      lastname: snapshot.lastname,
      username: snapshot.username,
      email: snapshot.email,
      passwordHash: snapshot.passwordHash,
      roles: snapshot.roles,
      status: snapshot.status,
      security: snapshot.security,
      activeEmail: snapshot.activeEmail,
      resetPassword: snapshot.resetPassword,
      preferences: snapshot.preferences,
      avatarName: snapshot.avatarName,
      lastVisit: snapshot.lastVisit,
      nbLogin: snapshot.nbLogin,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt
    };
  }

  private static jsonObject(value: Prisma.JsonValue, field: string, userId: string): Record<string, unknown> {
    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      throw new Error(`Invalid ${field} stored for user ${userId}.`);
    }

    return value;
  }

  private static securitySnapshot(value: Prisma.JsonValue, userId: string): SecuritySnapshot {
    const object = UserMapper.jsonObject(value, 'security', userId);

    return {
      totalWrongPassword: Number(object.totalWrongPassword ?? 0),
      totalWrongTwoFactorCode: Number(object.totalWrongTwoFactorCode ?? 0),
      totalTwoFactorSmsSent: Number(object.totalTwoFactorSmsSent ?? 0),
    };
  }

  private static activeEmailSnapshot(value: Prisma.JsonValue, userId: string): ActiveEmailSnapshot {
    const object = UserMapper.jsonObject(value, 'activeEmail', userId);

    return {
      mailSent: Number(object.mailSent ?? 0),
      token: typeof object.token === 'string' ? object.token : null,
      tokenTtl: typeof object.tokenTtl === 'number' ? object.tokenTtl : null,
      lastAttempt: typeof object.lastAttempt === 'string' ? object.lastAttempt : null,
    };
  }

  private static resetPasswordSnapshot(value: Prisma.JsonValue, userId: string): ResetPasswordSnapshot {
    const object = UserMapper.jsonObject(value, 'resetPassword', userId);

    return {
      mailSent: Number(object.mailSent ?? 0),
      token: typeof object.token === 'string' ? object.token : null,
      tokenTtl: typeof object.tokenTtl === 'number' ? object.tokenTtl : null,
    };
  }

  private static preferencesSnapshot(value: Prisma.JsonValue, userId: string): PreferencesSnapshot {
    const object = UserMapper.jsonObject(value, 'preferences', userId);

    return {
      lang: typeof object.lang === 'string' ? object.lang : 'fr',
    };
  }
}
