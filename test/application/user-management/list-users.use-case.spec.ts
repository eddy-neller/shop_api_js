import { describe, expect, it } from "vitest";
import { ListUsersQuery } from "@/application/user-management/use-case/query/list-users/list-users.query";
import { ListUsersUseCase } from "@/application/user-management/use-case/query/list-users/list-users.use-case";
import { User } from "@/domain/user/model/user.aggregate";
import { Email } from "@/domain/user/value-object/identity/email";
import { PasswordHash } from "@/domain/user/value-object/security/password-hash";
import { Preferences } from "@/domain/user/value-object/profile/preferences";
import { UserId } from "@/domain/user/value-object/identity/user-id";
import { UserRole } from "@/domain/user/value-object/access/user-role";
import { UserStatus } from "@/domain/user/value-object/lifecycle/user-status";
import { Username } from "@/domain/user/value-object/identity/username";
import { InMemoryUserRepository } from "../user/in-memory-user.repository";

type Seed = { id: string; username: string; email: string; createdAt: Date };

const SEEDS: Seed[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    username: "alice",
    email: "alice@example.com",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    username: "bob",
    email: "bob@example.com",
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    username: "carol",
    email: "carol@example.com",
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    username: "alicia",
    email: "alicia@example.com",
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    username: "dave",
    email: "dave@example.com",
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
  },
];

function makeUseCase(): ListUsersUseCase {
  const repository = new InMemoryUserRepository();

  for (const seed of SEEDS) {
    void repository.save(
      User.createByAdmin({
        id: UserId.fromString(seed.id),
        username: Username.fromString(seed.username),
        email: Email.fromString(seed.email),
        passwordHash: PasswordHash.fromString("hashed-password"),
        roles: [UserRole.User],
        status: UserStatus.active(),
        preferences: new Preferences(),
        now: seed.createdAt,
      }),
    );
  }

  return new ListUsersUseCase(repository);
}

describe("ListUsersUseCase", () => {
  it("paginates the result and returns total metadata", async () => {
    const useCase = makeUseCase();

    const result = await useCase.execute(new ListUsersQuery(1, 2, {}, []));

    expect(result.items).toHaveLength(2);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it("sorts by createdAt DESC by default", async () => {
    const useCase = makeUseCase();

    const result = await useCase.execute(new ListUsersQuery(1, 10, {}, []));

    expect(result.items.map((item) => item.username)).toEqual([
      "dave",
      "alicia",
      "carol",
      "bob",
      "alice",
    ]);
  });

  it("applies the explicit order carried by the query", async () => {
    const useCase = makeUseCase();

    const result = await useCase.execute(
      new ListUsersQuery(1, 10, {}, [
        { field: "username", direction: "ASC" },
      ]),
    );

    expect(result.items.map((item) => item.username)).toEqual([
      "alice",
      "alicia",
      "bob",
      "carol",
      "dave",
    ]);
  });

  it("filters by a case-insensitive username substring", async () => {
    const useCase = makeUseCase();

    const result = await useCase.execute(
      new ListUsersQuery(
        1,
        10,
        { username: "ali" },
        [{ field: "username", direction: "ASC" }],
      ),
    );

    expect(result.items.map((item) => item.username)).toEqual([
      "alice",
      "alicia",
    ]);
    expect(result.totalItems).toBe(2);
  });

  it("normalizes invalid pagination input to the shared defaults", async () => {
    const useCase = makeUseCase();

    const result = await useCase.execute(new ListUsersQuery(0, 0, {}, []));

    expect(result.items).toHaveLength(5);
  });

  it("carries the raw avatar name for each item", async () => {
    const useCase = makeUseCase();

    const result = await useCase.execute(new ListUsersQuery(1, 10, {}, []));

    for (const item of result.items) {
      expect(item.avatarName).toBeNull();
    }
  });
});
