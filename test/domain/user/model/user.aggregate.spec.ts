import { describe, expect, it } from 'vitest';
import { User } from '@/domain/user/model/user.aggregate';
import { Email } from '@/domain/user/value-object/identity/email';
import { Firstname } from '@/domain/user/value-object/profile/firstname';
import { Lastname } from '@/domain/user/value-object/profile/lastname';
import { PasswordHash } from '@/domain/user/value-object/security/password-hash';
import { UserId } from '@/domain/user/value-object/identity/user-id';
import { Preferences } from '@/domain/user/value-object/profile/preferences';
import { UserRole } from '@/domain/user/value-object/access/user-role';
import { UserStatus } from '@/domain/user/value-object/lifecycle/user-status';
import { Username } from '@/domain/user/value-object/identity/username';
import { ReauthenticationReason } from '@/domain/user/event/security/reauthentication-reason';
import { UserReauthenticationRequiredEvent } from '@/domain/user/event/security/user-reauthentication-required.event';

function expectReauthenticationEvent(
  event: unknown,
  userId: UserId,
  reason: ReauthenticationReason,
  occurredAt: Date,
): void {
  expect(event).toBeInstanceOf(UserReauthenticationRequiredEvent);

  const reauthenticationEvent = event as UserReauthenticationRequiredEvent;
  expect(reauthenticationEvent.userId).toBe(userId);
  expect(reauthenticationEvent.reason).toBe(reason);
  expect(reauthenticationEvent.occurredAt).toBe(occurredAt);
  expect(reauthenticationEvent.eventName()).toBe('user.reauthentication.required');
}

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
      loginCount: 0,
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

    user.pullEvents();

    user.registerWrongPasswordAttempt(2, now);
    user.registerWrongPasswordAttempt(2, now);

    expect(user.isLocked()).toBe(true);
    expect(user.toSnapshot().security.totalWrongPassword).toBe(2);

    const events = user.pullEvents();
    expect(events).toHaveLength(3);
    expectReauthenticationEvent(
      events[2],
      user.getId(),
      ReauthenticationReason.AccountLocked,
      now,
    );

    user.registerWrongPasswordAttempt(2, now);
    expect(user.pullEvents()).toHaveLength(1);
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
    const events = user.pullEvents();
    expect(events).toHaveLength(2);
    expectReauthenticationEvent(
      events[1],
      user.getId(),
      ReauthenticationReason.RolesChanged,
      updatedAt,
    );
  });

  it('requires reauthentication after a password reset', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.register({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      preferences: Preferences.fromObject({ lang: 'fr' }),
      now
    });
    user.requestPasswordReset('reset-token', new Date('2026-06-23T12:00:00.000Z'), now);
    user.pullEvents();

    user.completePasswordReset(
      'reset-token',
      PasswordHash.fromString('new-hashed-password'),
      now,
    );

    const events = user.pullEvents();
    expect(events).toHaveLength(2);
    expectReauthenticationEvent(
      events[1],
      user.getId(),
      ReauthenticationReason.PasswordReset,
      now,
    );
  });

  it('requires reauthentication when an admin disables an active user', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.createByAdmin({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      roles: [UserRole.User],
      status: UserStatus.active(),
      preferences: new Preferences(),
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
      status: UserStatus.blocked(),
      passwordHash: null
    });

    const events = user.pullEvents();
    expect(events).toHaveLength(2);
    expectReauthenticationEvent(
      events[1],
      user.getId(),
      ReauthenticationReason.AccessDisabled,
      now,
    );
  });

  it('prioritizes an admin password change when several sensitive fields change', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const user = User.createByAdmin({
      id: UserId.fromString('11111111-1111-4111-8111-111111111111'),
      username: Username.fromString('john'),
      email: Email.fromString('john@example.com'),
      passwordHash: PasswordHash.fromString('hashed-password'),
      roles: [UserRole.User],
      status: UserStatus.active(),
      preferences: new Preferences(),
      now
    });
    user.pullEvents();

    user.updateByAdmin({
      now,
      username: null,
      email: null,
      firstname: null,
      lastname: null,
      roles: [UserRole.Admin],
      status: UserStatus.blocked(),
      passwordHash: PasswordHash.fromString('new-hashed-password')
    });

    const events = user.pullEvents();
    expect(events).toHaveLength(2);
    expectReauthenticationEvent(
      events[1],
      user.getId(),
      ReauthenticationReason.PasswordChanged,
      now,
    );
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
    const events = user.pullEvents();
    expect(events).toHaveLength(2);
    expectReauthenticationEvent(
      events[1],
      user.getId(),
      ReauthenticationReason.PasswordChanged,
      now,
    );
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
    expect(events).toHaveLength(2);
    expect(events[0]?.eventName()).toBe('user.deleted_by_admin');
    expectReauthenticationEvent(
      events[1],
      user.getId(),
      ReauthenticationReason.AccountDeleted,
      now,
    );
  });
});
