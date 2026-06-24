import { describe, expect, it } from 'vitest';
import { User } from '@/domain/user/model/user.aggregate';
import { Email } from '@/domain/user/value-object/email';
import { Firstname } from '@/domain/user/value-object/firstname';
import { Lastname } from '@/domain/user/value-object/lastname';
import { PasswordHash } from '@/domain/user/value-object/password-hash';
import { UserId } from '@/domain/user/value-object/user-id';
import { Preferences } from '@/domain/user/value-object/preferences';
import { UserRole } from '@/domain/user/value-object/user-role';
import { UserStatus } from '@/domain/user/value-object/user-status';
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

  it('creates an active user by admin with explicit roles and identity', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.createByAdmin({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('jane'),
      email: Email.fromString('jane@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      roles: [UserRole.User, UserRole.Admin],
      status: UserStatus.active(),
      preferences: new Preferences(),
      now,
      firstname: Firstname.fromString('Jane'),
      lastname: Lastname.fromString('Doe')
    });

    const snapshot = user.toSnapshot();
    expect(snapshot.firstname).toBe('Jane');
    expect(snapshot.lastname).toBe('Doe');
    expect(snapshot.roles).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
    expect(snapshot.status).toBe(UserStatus.Active);
    expect(user.pullEvents()).toHaveLength(1);
  });

  it('updates only the provided fields and records an event', () => {
    const createdAt = new Date('2026-06-22T12:00:00.000Z');
    const updatedAt = new Date('2026-06-23T09:00:00.000Z');
    const user = User.createByAdmin({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('jane'),
      email: Email.fromString('jane@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      roles: [UserRole.User],
      status: UserStatus.active(),
      preferences: new Preferences(),
      now: createdAt
    });
    user.pullEvents();

    user.updateByAdmin({
      now: updatedAt,
      username: Username.fromString('janet'),
      email: null,
      firstname: Firstname.fromString('Janet'),
      lastname: null,
      roles: [UserRole.Admin],
      status: null,
      passwordHash: null
    });

    const snapshot = user.toSnapshot();
    expect(snapshot.username).toBe('janet');
    expect(snapshot.email).toBe('jane@example.com');
    expect(snapshot.firstname).toBe('Janet');
    expect(snapshot.roles).toEqual(['ROLE_ADMIN']);
    expect(snapshot.updatedAt).toEqual(updatedAt);
    expect(user.pullEvents()).toHaveLength(1);
  });

  it('does not record an event when updateByAdmin has nothing to change', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.register({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      preferences: Preferences.fromObject({ lang: 'fr' }),
      now
    });
    user.pullEvents();

    user.updateByAdmin({
      now,
      username: null,
      email: null,
      firstname: null,
      lastname: null,
      roles: null,
      status: null,
      passwordHash: null
    });

    expect(user.pullEvents()).toHaveLength(0);
  });

  it('changes the password and records an event', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.register({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      preferences: Preferences.fromObject({ lang: 'fr' }),
      now
    });
    user.pullEvents();

    user.changePassword(PasswordHash.fromString('new-hashed-password'), now);

    expect(user.toSnapshot().passwordHash).toBe('new-hashed-password');
    expect(user.pullEvents()).toHaveLength(1);
  });

  it('updates the avatar, touches updatedAt and records an event', () => {
    const createdAt = new Date('2026-06-22T12:00:00.000Z');
    const updatedAt = new Date('2026-06-23T09:00:00.000Z');
    const user = User.register({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      preferences: Preferences.fromObject({ lang: 'fr' }),
      now: createdAt
    });
    user.pullEvents();

    user.updateAvatar('avatar-hash.png', updatedAt);

    const snapshot = user.toSnapshot();
    expect(snapshot.avatarName).toBe('avatar-hash.png');
    expect(snapshot.updatedAt).toEqual(updatedAt);

    const events = user.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.eventName()).toBe('user.avatar_updated');
  });

  it('records a deletion event', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.register({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      preferences: Preferences.fromObject({ lang: 'fr' }),
      now
    });
    user.pullEvents();

    user.deleteByAdmin(now);

    const events = user.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.eventName()).toBe('user.deleted_by_admin');
  });
});
