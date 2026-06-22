import { describe, expect, it } from 'vitest';
import { User } from '@/domain/user/model/user.aggregate';
import { Email } from '@/domain/user/value-object/email';
import { PasswordHash } from '@/domain/user/value-object/password-hash';
import { UserId } from '@/domain/user/value-object/user-id';
import { Preferences } from '@/domain/user/value-object/preferences';
import { Username } from '@/domain/user/value-object/username';

describe('User aggregate', () => {
  it('registers a user and records a domain event', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.register({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      preferences: Preferences.fromObject({ lang: 'fr' }),
      now
    });

    expect(user.toSnapshot()).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      firstname: null,
      lastname: null,
      username: 'john',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
      roles: ['ROLE_USER'],
      status: 0,
      security: {
        totalWrongPassword: 0,
        totalWrongTwoFactorCode: 0,
        totalTwoFactorSmsSent: 0
      },
      activeEmail: {
        mailSent: 0,
        token: null,
        tokenTtl: null,
        lastAttempt: null
      },
      resetPassword: {
        mailSent: 0,
        token: null,
        tokenTtl: null
      },
      preferences: {
        lang: 'fr'
      },
      avatarName: null,
      lastVisit: now,
      nbLogin: 0,
      createdAt: now,
      updatedAt: now
    });
    expect(user.pullEvents()).toHaveLength(1);
    expect(user.pullEvents()).toHaveLength(0);
  });

  it('activates a user with a valid activation token', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.register({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      preferences: Preferences.fromObject({ lang: 'fr' }),
      now
    });

    user.requestActivation('token', new Date('2026-06-23T12:00:00.000Z'), now);
    user.activate('token', now);

    expect(user.isActive()).toBe(true);
    expect(user.toSnapshot().activeEmail.token).toBeNull();
  });

  it('blocks a user after too many wrong password attempts', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.register({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      preferences: Preferences.fromObject({ lang: 'fr' }),
      now
    });

    user.registerWrongPasswordAttempt(2, now);
    user.registerWrongPasswordAttempt(2, now);

    expect(user.isLocked()).toBe(true);
    expect(user.toSnapshot().security.totalWrongPassword).toBe(2);
  });
});
