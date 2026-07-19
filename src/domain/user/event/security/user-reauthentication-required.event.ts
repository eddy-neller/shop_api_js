import type { DomainEvent } from "@/domain/shared/event/domain-event";
import type { UserId } from "@/domain/user/value-object/identity/user-id";
import type { ReauthenticationReason } from "@/domain/user/event/security/reauthentication-reason";

export class UserReauthenticationRequiredEvent implements DomainEvent {
  public constructor(
    public readonly userId: UserId,
    public readonly reason: ReauthenticationReason,
    public readonly occurredAt: Date,
  ) {}

  public eventName(): string {
    return "user.reauthentication.required";
  }
}
