import type { DomainEvent } from "@/domain/shared/event/domain-event";
import type { UserId } from "@/domain/user/value-object/identity/user-id";

export class PasswordResetCompletedEvent implements DomainEvent {
  public constructor(
    public readonly userId: UserId,
    public readonly occurredAt: Date,
  ) {}

  public eventName(): string {
    return "user.password_reset.completed";
  }
}
