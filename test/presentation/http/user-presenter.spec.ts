import { describe, expect, it } from "vitest";
import { UserReadModel } from "@/application/user/dto/user-read-model";
import type { AvatarUrlResolverPort } from "@/application/user/port/avatar-url-resolver.port";
import { UserPresenter } from "@/presentation/http/user/presenter/user.response";
import { UserListPresenter } from "@/presentation/http/user/presenter/user-list.response";

const resolver: AvatarUrlResolverPort = {
  resolve: (avatarName) =>
    avatarName === null ? null : `/uploads/${avatarName}`,
};

function makeReadModel(avatarName: string | null): UserReadModel {
  return new UserReadModel(
    "11111111-1111-4111-8111-111111111111",
    null,
    null,
    "john",
    "john@example.com",
    ["ROLE_USER"],
    1,
    avatarName,
    "2026-06-22T12:00:00.000Z",
    "2026-06-22T12:00:00.000Z",
    "2026-06-22T12:00:00.000Z",
  );
}

describe("UserPresenter", () => {
  it("resolves the avatar url from the raw avatar name", () => {
    const response = new UserPresenter(resolver).present(
      makeReadModel("avatar.png"),
    );

    expect(response.avatarUrl).toBe("/uploads/avatar.png");
  });

  it("maps a null avatar name to a null url", () => {
    const response = new UserPresenter(resolver).present(makeReadModel(null));

    expect(response.avatarUrl).toBeNull();
  });
});

describe("UserListPresenter", () => {
  it("resolves the avatar url for each item", () => {
    const [response] = new UserListPresenter(resolver).present([
      makeReadModel("avatar.png"),
    ]);

    expect(response?.avatarUrl).toBe("/uploads/avatar.png");
  });
});
