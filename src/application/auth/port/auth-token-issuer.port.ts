import type { AuthTokensReadModel } from "@/application/auth/dto/auth-tokens.read-model";
import type { User } from "@/domain/user/model/user.aggregate";

export const AUTH_TOKEN_ISSUER = Symbol("AUTH_TOKEN_ISSUER");

export interface AuthTokenIssuerPort {
  issue(user: User, now: Date): Promise<AuthTokensReadModel>;
}
