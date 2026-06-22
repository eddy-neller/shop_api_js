import { BadRequestException } from "@nestjs/common";
import type { HttpException } from "@nestjs/common";
import type { Response } from "express";
import { describe, expect, it } from "vitest";
import { DomainException } from "@/domain/shared/exception/domain-exception";
import { InvalidUuidException } from "@/domain/shared/exception/invalid-uuid.exception";
import { ActivationLimitReachedException } from "@/domain/user/exception/activation-limit-reached.exception";
import { InvalidEmailException } from "@/domain/user/exception/invalid-email.exception";
import { ResetPasswordLimitReachedException } from "@/domain/user/exception/reset-password-limit-reached.exception";
import { EmailAlreadyUsedException } from "@/domain/user/exception/uniqueness/email-already-used.exception";
import { UsernameAlreadyUsedException } from "@/domain/user/exception/uniqueness/username-already-used.exception";
import { UserDomainException } from "@/domain/user/exception/user-domain-exception";
import { UserLockedException } from "@/domain/user/exception/user-locked.exception";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { writeHttpExceptionResponse } from "@/presentation/http/shared/filter/domain-exception.filter";
import { toUserHttpException } from "@/presentation/http/user/filter/user-domain-exception.filter";

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
    [new InvalidEmailException("invalid"), 400, "BadRequestException"],
    [
      new InvalidUuidException("user id", "invalid"),
      400,
      "BadRequestException",
    ],
    [
      new UserDomainException("Token de réinitialisation invalide."),
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
