import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { Response } from "express";
import { DomainException } from "@/domain/shared/exception/domain-exception";
import { InvalidUuidException } from "@/domain/shared/exception/invalid-uuid.exception";
import { ActivationLimitReachedException } from "@/domain/user/exception/activation-limit-reached.exception";
import { InvalidAvatarException } from "@/domain/user/exception/invalid-avatar.exception";
import { InvalidCurrentPasswordException } from "@/domain/user/exception/invalid-current-password.exception";
import { InvalidEmailException } from "@/domain/user/exception/invalid-email.exception";
import { InvalidFirstnameException } from "@/domain/user/exception/invalid-firstname.exception";
import { InvalidLastnameException } from "@/domain/user/exception/invalid-lastname.exception";
import { InvalidPreferencesException } from "@/domain/user/exception/invalid-preferences.exception";
import { InvalidRoleException } from "@/domain/user/exception/invalid-role.exception";
import { InvalidUserStatusException } from "@/domain/user/exception/invalid-user-status.exception";
import { ResetPasswordLimitReachedException } from "@/domain/user/exception/reset-password-limit-reached.exception";
import { SamePasswordException } from "@/domain/user/exception/same-password.exception";
import { EmailAlreadyUsedException } from "@/domain/user/exception/uniqueness/email-already-used.exception";
import { UsernameAlreadyUsedException } from "@/domain/user/exception/uniqueness/username-already-used.exception";
import { UserDomainException } from "@/domain/user/exception/user-domain-exception";
import { UserLockedException } from "@/domain/user/exception/user-locked.exception";
import { UserNotFoundException } from "@/domain/user/exception/user-not-found.exception";
import { writeHttpExceptionResponse } from "@/presentation/http/shared/filter/domain-exception.filter";

type DomainExceptionConstructor = abstract new (
  ...args: never[]
) => DomainException;

type UserExceptionMapping = {
  readonly exception: DomainExceptionConstructor;
  readonly toHttpException: (message: string) => HttpException;
};

class LockedException extends HttpException {
  public constructor(message: string) {
    super(message, HttpStatus.LOCKED);
    this.name = "LockedException";
  }
}

class TooManyRequestsHttpException extends HttpException {
  public constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
    this.name = "TooManyRequestsException";
  }
}

const USER_EXCEPTION_MAPPINGS: readonly UserExceptionMapping[] = [
  {
    exception: EmailAlreadyUsedException,
    toHttpException: (message) => new ConflictException(message),
  },
  {
    exception: UsernameAlreadyUsedException,
    toHttpException: (message) => new ConflictException(message),
  },
  {
    exception: UserNotFoundException,
    toHttpException: (message) => new NotFoundException(message),
  },
  {
    exception: ActivationLimitReachedException,
    toHttpException: (message) => new TooManyRequestsHttpException(message),
  },
  {
    exception: ResetPasswordLimitReachedException,
    toHttpException: (message) => new TooManyRequestsHttpException(message),
  },
  {
    exception: UserLockedException,
    toHttpException: (message) => new LockedException(message),
  },
  {
    exception: InvalidEmailException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
  {
    exception: InvalidFirstnameException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
  {
    exception: InvalidLastnameException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
  {
    exception: InvalidAvatarException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
  {
    exception: InvalidPreferencesException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
  {
    exception: InvalidUserStatusException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
  {
    exception: InvalidRoleException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
  {
    exception: InvalidCurrentPasswordException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
  {
    exception: SamePasswordException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
  {
    exception: InvalidUuidException,
    toHttpException: (message) => new UnprocessableEntityException(message),
  },
] as const;

export function toUserHttpException(exception: DomainException): HttpException {
  const mapping = USER_EXCEPTION_MAPPINGS.find(
    (candidate) => exception instanceof candidate.exception,
  );

  if (mapping !== undefined) {
    return mapping.toHttpException(exception.message);
  }

  return new BadRequestException(exception.message);
}

@Catch(UserDomainException, InvalidUuidException)
export class UserDomainExceptionFilter implements ExceptionFilter {
  public catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const httpException = toUserHttpException(exception);

    writeHttpExceptionResponse(response, httpException);
  }
}
