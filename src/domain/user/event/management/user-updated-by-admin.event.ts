import type { DomainEvent } from "@/domain/shared/event/domain-event";
import type { UserId } from "@/domain/user/value-object/identity/user-id";

export class UserUpdatedByAdminEvent implements DomainEvent {
  public constructor(
    public readonly userId: UserId,
    public readonly occurredAt: Date,
  ) {}

  public eventName(): string {
    return "user.updated_by_admin";
  }
}
