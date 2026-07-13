import type { DomainEvent } from "@/domain/shared/event/domain-event";
import type { Email } from "@/domain/user/value-object/identity/email";
import type { UserId } from "@/domain/user/value-object/identity/user-id";

export class UserCreatedByAdminEvent implements DomainEvent {
  public constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly occurredAt: Date,
  ) {}

  public eventName(): string {
    return "user.created_by_admin";
  }
}
