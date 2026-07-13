export const REFRESH_TOKEN_HASHER = Symbol("REFRESH_TOKEN_HASHER");

export interface RefreshTokenHasherPort {
  hash(rawToken: string): string;
}
