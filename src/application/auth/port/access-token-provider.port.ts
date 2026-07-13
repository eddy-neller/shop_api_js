export const ACCESS_TOKEN_PROVIDER = Symbol("ACCESS_TOKEN_PROVIDER");

export type AccessTokenClaims = {
  sub: string;
  email: string;
  username: string;
  roles: string[];
};

export type IssuedAccessToken = {
  token: string;
  expiresIn: number;
};

export interface AccessTokenProviderPort {
  issue(claims: AccessTokenClaims): IssuedAccessToken;
  verify(token: string): AccessTokenClaims;
}
