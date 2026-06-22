export interface DomainEvent {
  readonly occurredAt: Date;
  eventName(): string;
}
