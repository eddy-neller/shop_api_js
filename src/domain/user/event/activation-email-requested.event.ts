import type { DomainEvent } from "@/domain/shared/event/domain-event";
import type { Email } from "@/domain/user/value-object/email";
import type { UserId } from "@/domain/user/value-object/user-id";

export class ActivationEmailRequestedEvent implements DomainEvent {
  public constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly occurredAt: Date,
  ) {}

  public eventName(): string {
    return "user.activation_email.requested";
  }
}
