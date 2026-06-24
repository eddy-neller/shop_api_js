import type { DomainEvent } from "@/domain/shared/event/domain-event";
import type { UserId } from "@/domain/user/value-object/user-id";

export class UserDeletedByAdminEvent implements DomainEvent {
  public constructor(
    public readonly userId: UserId,
    public readonly occurredAt: Date,
  ) {}

  public eventName(): string {
    return "user.deleted_by_admin";
  }
}
