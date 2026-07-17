# Microservices Roadmap

## Status

Proposed learning and evolution roadmap.

This document captures the current architectural direction for progressively moving E.N Shop toward a microservices architecture without losing the benefits of the existing Clean Architecture / DDD structure.

## Context

The current NestJS API already has a strong separation between Domain, Application, Infrastructure, and Presentation layers. This makes it a good candidate for a progressive microservices learning path.

The goal is not to split the system too early. A poorly structured modular monolith usually becomes a poorly structured distributed system. The first step is therefore to keep bounded contexts clear inside the codebase, then extract services only when the boundaries and communication contracts are explicit.

The Symfony / API Platform API in `../api/` remains the functional and architectural reference for business consistency.

## Recommended First Services

The first target is a small, pragmatic microservice landscape:

```text
identity-service
notification-service
shop-service
```

### identity-service

This service is the natural evolution of the current `api_js` project.

Responsibilities:

- user registration
- account activation
- authentication
- refresh tokens
- password reset
- user profile
- avatar handling
- user security rules

Example events published by this service:

```text
UserRegistered
UserActivated
PasswordResetRequested
UserEmailChanged
UserDeleted
```

### notification-service

This should be the first separate service because it is naturally asynchronous and has limited business authority.

Responsibilities:

- send account activation emails
- send password reset emails
- send system notifications
- optionally store notification delivery history

It consumes events such as:

```text
UserRegistered
PasswordResetRequested
```

This service must not decide whether a user is allowed to reset a password. That decision belongs to `identity-service`. `notification-service` only reacts to an already validated business event.

### shop-service

This is the first real separated business domain after identity.

Responsibilities:

- shop creation
- shop owner reference
- shop status
- shop validation rules
- later: opening hours, address, branding, seller configuration

Example model shape:

```text
Shop
  id
  ownerUserId
  name
  slug
  status
```

`shop-service` may reference a user through `ownerUserId`, but it must not read the `users` table directly. If it needs user information, it should either call `identity-service` through an explicit contract or consume user-related events.

## Longer-Term E-Commerce Target

The broader e-commerce target can later include:

```text
catalog-service
order-service
payment-service
```

### catalog-service

Possible responsibilities:

- products
- categories
- variants
- simple stock information
- search/indexing integration later

### order-service

Possible responsibilities:

- carts
- orders
- order status
- cancellation rules
- stock reservation coordination later

### payment-service

Possible responsibilities:

- payment provider integration
- payment webhooks
- refunds
- payment idempotency
- consistency with orders

These services are intentionally not part of the first extraction phase because they introduce harder distributed systems concerns earlier: stock consistency, order state machines, external payment webhooks, refunds, and idempotency.

## Phased Path

### Phase 1 - Stabilize identity and learn messaging

```text
identity-service
notification-service
```

Goals:

- treat `api_js` as the future `identity-service`
- reuse the existing Domain events emitted by the `User` aggregate
- collect those events from application use cases
- implement a transactional outbox
- publish events to a message broker
- create a small `notification-service` consuming identity events

Recommended broker for learning:

```text
RabbitMQ or NATS
```

Kafka is useful later, but it is not the best first step for this project.

### Communication and transport choices

The transport must be selected according to the interaction, rather than as a
repository or monorepo decision.

For the first phase, the recommended choice is **RabbitMQ**. It fits the
asynchronous side effects of Identity events (`UserRegistered`,
`PasswordResetRequested`): routing to consumers, acknowledgements,
redelivery, retry policies and dead-letter queues. The `identity-service`
should publish through its transactional outbox; consumers, including
`notification-service`, must remain idempotent because a message can be
delivered more than once.

Synchronous requests between services should remain explicit contracts. HTTP
is sufficient at first. gRPC is an optional later choice for internal,
latency-sensitive request/response calls when a typed protobuf contract brings
a concrete benefit. It does not replace asynchronous events: a request such as
"send an activation email" remains an event-driven side effect.

Kafka is a later option, not a default. Introduce it only if the system needs
durable event retention and replay, several independent projections or
consumers, stream processing, analytics, or sustained high-volume event
flows. Its operational and conceptual cost is not justified by the initial
Identity-to-Notification integration.

```text
Phase 1: RabbitMQ + transactional outbox
Synchronous calls: HTTP first; gRPC when a concrete internal RPC need emerges
Later: Kafka when replay, projections, analytics or streaming justify it
```

### Phase 2 - Extract the first business service

```text
shop-service
```

Goals:

- introduce a real separate business domain
- keep a database owned by the service
- reference users by id, not by shared tables
- define contracts with `identity-service`
- handle eventual consistency explicitly

### Phase 3 - Extend toward a full e-commerce system

```text
catalog-service
order-service
payment-service
```

Goals:

- introduce product and catalog ownership
- introduce order workflows
- introduce payment provider integration
- handle idempotency and external webhooks
- add stronger contract and integration testing

## Core Principles

- Split by business capability, not by technical layer.
- Keep one database ownership boundary per service.
- Do not share Prisma models across services as business contracts.
- Use explicit HTTP contracts or message contracts between services.
- Prefer asynchronous events for side effects.
- Use a transactional outbox when publishing events caused by database mutations.
- Make consumers idempotent.
- Keep business decisions in the service that owns the relevant domain.
- Add observability gradually: correlation ids, structured logs, health checks, then tracing.

## Transactional Outbox Direction

For business events caused by a database mutation, avoid this sequence:

```text
save user
publish event
```

Prefer:

```text
transaction:
  save user
  save event in outbox_events

worker:
  read unpublished outbox_events
  publish events to broker
  mark events as published
```

This avoids losing events when the database write succeeds but the publish step fails.

## Non-Goals For The First Step

The first implementation should not introduce:

- Kubernetes
- service mesh
- complex API gateway
- Kafka unless a specific need appears
- distributed tracing as a prerequisite
- direct database sharing between services
- premature extraction of catalog, order, or payment

## Open Questions

- Should the first broker be RabbitMQ or NATS?
- Should `notification-service` live in this repository at first or in a sibling repository?
- What is the first event contract format: JSON Schema, AsyncAPI, or TypeScript package?
- Should the current NestJS project be renamed to `identity-service` now or only once the first external service exists?
