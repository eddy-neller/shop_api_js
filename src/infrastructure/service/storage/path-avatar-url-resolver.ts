import type { ConfigPort } from "@/application/shared/port/config.port";
import type { AvatarUrlResolverPort } from "@/application/account/port/avatar-url-resolver.port";

const DEFAULT_BASE_URL = "/uploads/images/user/avatar";

export class PathAvatarUrlResolver implements AvatarUrlResolverPort {
  public constructor(private readonly config: ConfigPort) {}

  public resolve(avatarName: string | null): string | null {
    if (avatarName === null) {
      return null;
    }

    const baseUrl = this.config
      .getString("AVATAR_BASE_URL", DEFAULT_BASE_URL)
      .replace(/\/$/, "");

    return `${baseUrl}/${avatarName}`;
  }
}
