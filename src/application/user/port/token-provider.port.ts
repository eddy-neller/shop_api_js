import type { Email } from "@/domain/user/value-object/email";

export const TOKEN_PROVIDER = Symbol("TOKEN_PROVIDER");

export type SplitToken = {
  email?: string;
  token?: string;
};

export interface TokenProviderPort {
  generateRandomToken(): string;
  encode(token: string, email: Email): string;
  split(encodedToken: string): SplitToken;
}
