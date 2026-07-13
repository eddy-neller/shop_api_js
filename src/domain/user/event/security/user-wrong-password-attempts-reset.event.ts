import type { DomainEvent } from "@/domain/shared/event/domain-event";
import type { UserId } from "@/domain/user/value-object/identity/user-id";

export class UserWrongPasswordAttemptsResetEvent implements DomainEvent {
  public constructor(
    public readonly userId: UserId,
    public readonly occurredAt: Date,
  ) {}

  public eventName(): string {
    return "user.wrong_password_attempts.reset";
  }
}
