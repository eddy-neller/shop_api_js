import type { ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import {
  AVATAR_CROSS_ORIGIN_RESOURCE_POLICY,
  setAvatarSecurityHeaders,
} from "@/infrastructure/nest/security/avatar-security-headers";

describe("setAvatarSecurityHeaders", () => {
  it("allows avatars to be embedded from a separate origin", () => {
    const setHeader = vi.fn();
    const response = { setHeader } as unknown as ServerResponse;

    setAvatarSecurityHeaders(response);

    expect(setHeader).toHaveBeenCalledWith(
      "Cross-Origin-Resource-Policy",
      AVATAR_CROSS_ORIGIN_RESOURCE_POLICY,
    );
  });
});
