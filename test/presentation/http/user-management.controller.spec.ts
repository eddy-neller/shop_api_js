import type { CommandBus, QueryBus } from "@nestjs/cqrs";
import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { UpdateAvatarCommand } from "@/application/account/use-case/command/update-avatar/update-avatar.command";
import { UserReadModel } from "@/application/shared/dto/user-read-model";
import type { UserListReadModel } from "@/application/user-management/dto/user-list.read-model";
import { ListUsersQuery } from "@/application/user-management/use-case/query/list-users/list-users.query";
import type {
  UserPresenter,
  UserResponse,
} from "@/presentation/http/shared/presenter/user.response";
import type { UserListPresenter } from "@/presentation/http/user-management/presenter/user-list.response";
import { UserManagementController } from "@/presentation/http/user-management/user-management.controller";

const USER_ID = "5b021b95-e0e7-4f1c-959e-7645e8bf522c";

describe("UserManagementController", () => {
  it("keeps every requested sort criterion in the documented priority order", async () => {
    const result: UserListReadModel = {
      items: [],
      totalItems: 0,
      totalPages: 0,
    };
    const execute = vi.fn().mockResolvedValue(result);
    const setHeader = vi.fn();
    const controller = new UserManagementController(
      {} as CommandBus,
      { execute } as unknown as QueryBus,
      {} as UserPresenter,
      { present: vi.fn().mockReturnValue([]) } as unknown as UserListPresenter,
    );

    await expect(
      controller.list(
        {
          order: { createdAt: "DESC", username: "ASC" },
        },
        { setHeader } as unknown as Response,
      ),
    ).resolves.toEqual([]);

    expect(execute).toHaveBeenCalledOnce();
    expect(execute.mock.calls[0]?.[0]).toBeInstanceOf(ListUsersQuery);
    expect(execute.mock.calls[0]?.[0]).toMatchObject({
      order: [
        { field: "username", direction: "ASC" },
        { field: "createdAt", direction: "DESC" },
      ],
    });
    expect(setHeader).toHaveBeenCalledWith("X-Total-Count", 0);
    expect(setHeader).toHaveBeenCalledWith("X-Total-Pages", 0);
  });

  it("uploads an avatar for the user selected by an admin", async () => {
    const file = {
      buffer: Buffer.from("avatar"),
      mimetype: "image/png",
      size: 6,
      originalname: "avatar.png",
    } as unknown as Express.Multer.File;
    const user = new UserReadModel(
      USER_ID,
      null,
      null,
      "jane",
      "jane@example.com",
      ["ROLE_USER"],
      1,
      "stored-avatar.png",
      "2026-01-01T00:00:00.000Z",
      0,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    const response: UserResponse = {
      id: USER_ID,
      firstname: null,
      lastname: null,
      username: "jane",
      email: "jane@example.com",
      roles: ["ROLE_USER"],
      status: 1,
      avatarUrl: "/uploads/images/user/avatar/stored-avatar.png",
      lastVisit: "2026-01-01T00:00:00.000Z",
      nbLogin: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const execute = vi.fn().mockResolvedValue(user);
    const present = vi.fn().mockReturnValue(response);
    const controller = new UserManagementController(
      { execute } as unknown as CommandBus,
      {} as QueryBus,
      { present } as unknown as UserPresenter,
      {} as UserListPresenter,
    );

    await expect(controller.updateAvatarByAdmin(USER_ID, file)).resolves.toEqual(
      response,
    );
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        file: {
          buffer: file.buffer,
          mimeType: "image/png",
          size: 6,
          originalName: "avatar.png",
        },
      }),
    );
    expect(execute.mock.calls[0]?.[0]).toBeInstanceOf(UpdateAvatarCommand);
    expect(present).toHaveBeenCalledWith(user);
  });
});
