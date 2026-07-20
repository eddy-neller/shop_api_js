import { BadRequestException } from "@nestjs/common";
import type { ArgumentsHost, HttpException } from "@nestjs/common";
import type { Response } from "express";
import { describe, expect, it } from "vitest";
import { DomainException } from "@/domain/shared/exception/domain-exception";
import { InvalidUuidException } from "@/domain/shared/exception/invalid-uuid.exception";
import { ActivationLimitReachedException } from "@/domain/user/exception/rate-limit/activation-limit-reached.exception";
import { InvalidAvatarException } from "@/domain/user/exception/profile/invalid-avatar.exception";
import { InvalidCurrentPasswordException } from "@/domain/user/exception/security/invalid-current-password.exception";
import { InvalidEmailException } from "@/domain/user/exception/identity/invalid-email.exception";
import { InvalidFirstnameException } from "@/domain/user/exception/profile/invalid-firstname.exception";
import { InvalidLastnameException } from "@/domain/user/exception/profile/invalid-lastname.exception";
import { InvalidPreferencesException } from "@/domain/user/exception/profile/invalid-preferences.exception";
import { InvalidRoleException } from "@/domain/user/exception/access/invalid-role.exception";
import { InvalidUserStatusException } from "@/domain/user/exception/lifecycle/invalid-user-status.exception";
import { ResetPasswordLimitReachedException } from "@/domain/user/exception/rate-limit/reset-password-limit-reached.exception";
import { SamePasswordException } from "@/domain/user/exception/security/same-password.exception";
import { EmailAlreadyUsedException } from "@/domain/user/exception/uniqueness/email-already-used.exception";
import { UsernameAlreadyUsedException } from "@/domain/user/exception/uniqueness/username-already-used.exception";
import { UserDomainException } from "@/domain/user/exception/user-domain-exception";
import { UserLockedException } from "@/domain/user/exception/security/user-locked.exception";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import {
  DomainExceptionFilter,
  writeHttpExceptionResponse,
} from "@/presentation/http/shared/filter/domain-exception.filter";
import { toUserHttpException } from "@/presentation/http/shared/filter/user-domain-exception.filter";

type HttpResponseBody = {
  readonly statusCode: number;
  readonly error: string;
  readonly message: string;
};

class UnknownDomainException extends DomainException {
  public constructor() {
    super("Unknown domain error.");
  }
}

class FakeResponse {
  public statusCode: number | null = null;
  public body: HttpResponseBody | null = null;

  public status(statusCode: number): this {
    this.statusCode = statusCode;

    return this;
  }

  public json(body: HttpResponseBody): this {
    this.body = body;

    return this;
  }
}

describe("toUserHttpException", () => {
  it.each([
    [new EmailAlreadyUsedException(), 409, "ConflictException"],
    [new UsernameAlreadyUsedException(), 409, "ConflictException"],
    [new UserNotFoundException("missing-user"), 404, "NotFoundException"],
    [
      new ActivationLimitReachedException(),
      429,
      "TooManyRequestsException",
    ],
    [
      new ResetPasswordLimitReachedException(),
      429,
      "TooManyRequestsException",
    ],
    [new UserLockedException(), 423, "LockedException"],
    [
      new InvalidEmailException("invalid"),
      422,
      "UnprocessableEntityException",
    ],
    [
      InvalidFirstnameException.tooShort(2),
      422,
      "UnprocessableEntityException",
    ],
    [
      InvalidLastnameException.tooShort(2),
      422,
      "UnprocessableEntityException",
    ],
    [
      InvalidAvatarException.missing(),
      422,
      "UnprocessableEntityException",
    ],
    [
      new InvalidCurrentPasswordException(),
      422,
      "UnprocessableEntityException",
    ],
    [new SamePasswordException(), 422, "UnprocessableEntityException"],
    [
      InvalidPreferencesException.unsupportedLang("de"),
      422,
      "UnprocessableEntityException",
    ],
    [
      InvalidUserStatusException.unsupported(99),
      422,
      "UnprocessableEntityException",
    ],
    [
      InvalidRoleException.unknown("ROLE_UNKNOWN"),
      422,
      "UnprocessableEntityException",
    ],
    [
      InvalidRoleException.notAssignable("ROLE_SUPER_ADMIN"),
      422,
      "UnprocessableEntityException",
    ],
    [
      new InvalidUuidException("user id", "invalid"),
      422,
      "UnprocessableEntityException",
    ],
    [
      new UserDomainException("Password reset token is invalid."),
      400,
      "BadRequestException",
    ],
    [new UnknownDomainException(), 400, "BadRequestException"],
  ])(
    "maps %s to HTTP %i",
    (exception, expectedStatus, expectedName) => {
      const httpException = toUserHttpException(exception);

      expect(httpException.getStatus()).toBe(expectedStatus);
      expect(httpException.name).toBe(expectedName);
      expect(httpException.message).toBe(exception.message);
    },
  );

});

describe("DomainExceptionFilter (global fallback)", () => {
  const filterHostFor = (response: FakeResponse): ArgumentsHost =>
    ({
      switchToHttp: () => ({ getResponse: () => response }),
    }) as unknown as ArgumentsHost;

  it.each([
    [new UnknownDomainException()],
    [new UserDomainException("Unhandled domain rule.")],
  ])(
    "renders any unhandled DomainException as a clean 400 (%s)",
    (exception) => {
      const response = new FakeResponse();

      new DomainExceptionFilter().catch(exception, filterHostFor(response));

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        error: "BadRequestException",
        message: exception.message,
      });
    },
  );
});

describe("writeHttpExceptionResponse", () => {
  it("writes the stable HTTP error body", () => {
    const response = new FakeResponse();
    const httpException: HttpException = new BadRequestException(
      "Invalid request.",
    );

    writeHttpExceptionResponse(response as unknown as Response, httpException);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      statusCode: 400,
      error: "BadRequestException",
      message: "Invalid request.",
    });
  });
});
