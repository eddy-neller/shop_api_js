import type { DomainEvent } from "@/domain/shared/event/domain-event";
import { ActivationEmailRequestedEvent } from "@/domain/user/event/activation-email-requested.event";
import { PasswordResetCompletedEvent } from "@/domain/user/event/password-reset-completed.event";
import { PasswordResetRequestedEvent } from "@/domain/user/event/password-reset-requested.event";
import { UserActivatedEvent } from "@/domain/user/event/user-activated.event";
import { UserRegisteredEvent } from "@/domain/user/event/user-registered.event";
import { UserWrongPasswordAttemptRegisteredEvent } from "@/domain/user/event/user-wrong-password-attempt-registered.event";
import { UserWrongPasswordAttemptsResetEvent } from "@/domain/user/event/user-wrong-password-attempts-reset.event";
import { ActivationLimitReachedException } from "@/domain/user/exception/activation-limit-reached.exception";
import { ResetPasswordLimitReachedException } from "@/domain/user/exception/reset-password-limit-reached.exception";
import { UserDomainException } from "@/domain/user/exception/user-domain-exception";
import { UserLockedException } from "@/domain/user/exception/user-locked.exception";
import {
  ActiveEmail,
  type ActiveEmailSnapshot,
} from "@/domain/user/value-object/active-email";
import { Email } from "@/domain/user/value-object/email";
import { PasswordHash } from "@/domain/user/value-object/password-hash";
import {
  Preferences,
  type PreferencesSnapshot,
} from "@/domain/user/value-object/preferences";
import {
  ResetPassword,
  type ResetPasswordSnapshot,
} from "@/domain/user/value-object/reset-password";
import {
  Security,
  type SecuritySnapshot,
} from "@/domain/user/value-object/security";
import { UserId } from "@/domain/user/value-object/user-id";
import { UserRole } from "@/domain/user/value-object/user-role";
import { UserStatus } from "@/domain/user/value-object/user-status";
import { Username } from "@/domain/user/value-object/username";

const MAX_TOKEN_REQUESTS = 3;

export type UserSnapshot = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  username: string;
  email: string;
  passwordHash: string;
  roles: string[];
  status: number;
  security: SecuritySnapshot;
  activeEmail: ActiveEmailSnapshot;
  resetPassword: ResetPasswordSnapshot;
  preferences: PreferencesSnapshot;
  avatarName: string | null;
  lastVisit: Date;
  nbLogin: number;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  private readonly events: DomainEvent[] = [];

  private constructor(
    private readonly id: UserId,
    private firstname: string | null,
    private lastname: string | null,
    private username: Username,
    private email: Email,
    private passwordHash: PasswordHash,
    private readonly roles: UserRole[],
    private status: UserStatus,
    private security: Security,
    private activeEmail: ActiveEmail,
    private resetPassword: ResetPassword,
    private preferences: Preferences,
    private avatarName: string | null,
    private lastVisit: Date,
    private nbLogin: number,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static register(params: {
    id: UserId;
    username: Username;
    email: Email;
    passwordHash: PasswordHash;
    preferences: Preferences;
    now: Date;
  }): User {
    const user = new User(
      params.id,
      null,
      null,
      params.username,
      params.email,
      params.passwordHash,
      [UserRole.User],
      UserStatus.inactive(),
      new Security(),
      new ActiveEmail(),
      new ResetPassword(),
      params.preferences,
      null,
      params.now,
      0,
      params.now,
      params.now,
    );

    user.events.push(
      new UserRegisteredEvent(params.id, params.email, params.now),
    );

    return user;
  }

  public static fromSnapshot(snapshot: UserSnapshot): User {
    return new User(
      UserId.fromString(snapshot.id),
      snapshot.firstname,
      snapshot.lastname,
      Username.fromString(snapshot.username),
      Email.fromString(snapshot.email),
      PasswordHash.fromString(snapshot.passwordHash),
      snapshot.roles.map((role) => role as UserRole),
      UserStatus.fromNumber(snapshot.status),
      Security.fromObject(snapshot.security),
      ActiveEmail.fromObject(snapshot.activeEmail),
      ResetPassword.fromObject(snapshot.resetPassword),
      Preferences.fromObject(snapshot.preferences),
      snapshot.avatarName,
      snapshot.lastVisit,
      snapshot.nbLogin,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  public requestActivation(token: string, expiresAt: Date, now: Date): void {
    this.assertNotLocked();
    this.refreshActivationIfExpired(now);

    if (this.activeEmail.getMailSent() >= MAX_TOKEN_REQUESTS) {
      throw new ActivationLimitReachedException();
    }

    this.activeEmail = new ActiveEmail(
      this.activeEmail.getMailSent() + 1,
      token,
      User.toUnixTimestamp(expiresAt),
      now,
    );

    this.events.push(
      new ActivationEmailRequestedEvent(this.id, this.email, now),
    );
  }

  public activate(token: string, now: Date): void {
    this.assertNotLocked();
    this.assertActivationTokenValid(token, now);
    this.status = UserStatus.active();
    this.clearActivation();
    this.touch(now);

    this.events.push(new UserActivatedEvent(this.id, now));
  }

  public clearActivation(): void {
    this.activeEmail = new ActiveEmail();
  }

  public requestPasswordReset(token: string, expiresAt: Date, now: Date): void {
    this.assertNotLocked();
    this.refreshResetPasswordIfExpired(now);

    if (this.resetPassword.getMailSent() >= MAX_TOKEN_REQUESTS) {
      throw new ResetPasswordLimitReachedException();
    }

    this.resetPassword = new ResetPassword(
      this.resetPassword.getMailSent() + 1,
      token,
      User.toUnixTimestamp(expiresAt),
    );

    this.events.push(new PasswordResetRequestedEvent(this.id, this.email, now));
  }

  public completePasswordReset(
    token: string,
    passwordHash: PasswordHash,
    now: Date,
  ): void {
    this.assertResetPasswordTokenValid(token, now);
    this.passwordHash = passwordHash;
    this.resetPassword = new ResetPassword();
    this.touch(now);

    this.events.push(new PasswordResetCompletedEvent(this.id, now));
  }

  public registerWrongPasswordAttempt(maxAttempts: number, now: Date): void {
    const attempts = this.security.getTotalWrongPassword() + 1;
    this.security = this.security.withTotalWrongPassword(attempts);

    if (attempts >= maxAttempts) {
      this.status = UserStatus.blocked();
    }

    this.touch(now);
    this.events.push(new UserWrongPasswordAttemptRegisteredEvent(this.id, now));
  }

  public resetWrongPasswordAttempts(now: Date): void {
    if (this.security.getTotalWrongPassword() === 0) {
      return;
    }

    this.security = this.security.withTotalWrongPassword(0);

    if (this.status.isBlocked()) {
      this.status = UserStatus.active();
    }

    this.touch(now);
    this.events.push(new UserWrongPasswordAttemptsResetEvent(this.id, now));
  }

  public isActive(): boolean {
    return this.status.isActive();
  }

  public isLocked(): boolean {
    return this.status.isBlocked();
  }

  public pullEvents(): DomainEvent[] {
    return this.events.splice(0, this.events.length);
  }

  public toSnapshot(): UserSnapshot {
    return {
      id: this.id.toString(),
      firstname: this.firstname,
      lastname: this.lastname,
      username: this.username.toString(),
      email: this.email.toString(),
      passwordHash: this.passwordHash.toString(),
      roles: [...this.roles],
      status: this.status.toNumber(),
      security: this.security.toObject(),
      activeEmail: this.activeEmail.toObject(),
      resetPassword: this.resetPassword.toObject(),
      preferences: this.preferences.toObject(),
      avatarName: this.avatarName,
      lastVisit: this.lastVisit,
      nbLogin: this.nbLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private touch(now: Date): void {
    this.updatedAt = now;
  }

  private assertActivationTokenValid(token: string, now: Date): void {
    const ttl = this.activeEmail.getTokenTtl() ?? 0;

    if (ttl <= 0 || ttl <= User.toUnixTimestamp(now)) {
      throw new UserDomainException("Token d'activation expiré.");
    }

    if (this.activeEmail.getToken() !== token) {
      throw new UserDomainException("Token d'activation invalide.");
    }
  }

  private assertResetPasswordTokenValid(token: string, now: Date): void {
    const ttl = this.resetPassword.getTokenTtl() ?? 0;

    if (ttl <= 0 || ttl <= User.toUnixTimestamp(now)) {
      throw new UserDomainException("Token de réinitialisation expiré.");
    }

    if (this.resetPassword.getToken() !== token) {
      throw new UserDomainException("Token de réinitialisation invalide.");
    }
  }

  private refreshActivationIfExpired(now: Date): void {
    const ttl = this.activeEmail.getTokenTtl();

    if (ttl !== null && ttl <= User.toUnixTimestamp(now)) {
      this.activeEmail = new ActiveEmail();
    }
  }

  private refreshResetPasswordIfExpired(now: Date): void {
    const ttl = this.resetPassword.getTokenTtl();

    if (ttl !== null && ttl <= User.toUnixTimestamp(now)) {
      this.resetPassword = new ResetPassword();
    }
  }

  private assertNotLocked(): void {
    if (this.status.isBlocked()) {
      throw new UserLockedException();
    }
  }

  private static toUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }
}
