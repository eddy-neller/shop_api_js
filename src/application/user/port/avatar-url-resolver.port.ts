export const AVATAR_URL_RESOLVER = Symbol("AVATAR_URL_RESOLVER");

export interface AvatarUrlResolverPort {
  resolve(avatarName: string | null): string | null;
}
