# en_shop API JS

Secondary API focused on the `User` domain, built with NestJS, Prisma, Clean Architecture, DDD, and CQRS.

## Stack

- Node.js 22+
- NestJS
- Prisma
- PostgreSQL
- Vitest

## Install

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev
npm run start:dev
```

## Fixtures

```bash
npm run fixtures:dev
npm run fixtures:test
```

`prisma db seed` loads the `dev` fixtures by default. Set `FIXTURE_GROUP=test` to load the test dataset.

## User HTTP API

```http
POST /users/register
Content-Type: application/json

{
  "email": "john@example.com",
  "username": "john",
  "password": "ChangeMe123!"
}
```

```http
GET /users/:id
```

```http
POST /users/register/email-activation-request
POST /users/register/validation
POST /users/reset-password/request
POST /users/reset-password/confirm
```

## Architecture

```text
Presentation -> Nest CommandBus/QueryBus -> Infrastructure CQRS handlers
                                            -> Application use cases
                                            -> Domain
                                            -> Application ports
                                            -> Infrastructure adapters
```

The domain and application layers do not import NestJS or Prisma.
