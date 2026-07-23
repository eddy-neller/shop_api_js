import type { ServerResponse } from "node:http";

export const AVATAR_CROSS_ORIGIN_RESOURCE_POLICY = "cross-origin";

export function setAvatarSecurityHeaders(response: ServerResponse): void {
  response.setHeader(
    "Cross-Origin-Resource-Policy",
    AVATAR_CROSS_ORIGIN_RESOURCE_POLICY,
  );
}
