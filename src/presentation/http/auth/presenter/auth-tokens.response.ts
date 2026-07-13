import type { AuthTokensReadModel } from "@/application/auth/dto/auth-tokens.read-model";

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

// Presenter sans dependance: simple methode statique (cf. presentation/AGENTS.md).
export class AuthTokensPresenter {
  public static present(tokens: AuthTokensReadModel): AuthTokensResponse {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
    };
  }
}
