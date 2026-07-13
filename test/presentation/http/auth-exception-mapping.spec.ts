import { describe, expect, it } from "vitest";
import { AccountNotActivatedException } from "@/domain/user/exception/lifecycle/account-not-activated.exception";
import { InvalidCredentialsException } from "@/domain/user/exception/security/invalid-credentials.exception";
import { InvalidRefreshTokenException } from "@/domain/user/exception/security/invalid-refresh-token.exception";
import { toUserHttpException } from "@/presentation/http/shared/filter/user-domain-exception.filter";

describe("toUserHttpException (authentication)", () => {
  it.each([
    [new InvalidCredentialsException(), 401, "UnauthorizedException"],
    [new InvalidRefreshTokenException(), 401, "UnauthorizedException"],
    [new AccountNotActivatedException(), 403, "ForbiddenException"],
  ])("maps %s to HTTP %i", (exception, expectedStatus, expectedName) => {
    const httpException = toUserHttpException(exception);

    expect(httpException.getStatus()).toBe(expectedStatus);
    expect(httpException.name).toBe(expectedName);
    expect(httpException.message).toBe(exception.message);
  });
});
