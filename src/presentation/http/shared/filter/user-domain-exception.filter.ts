import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { Response } from "express";
import { DomainException } from "@/domain/shared/exception/domain-exception";
import { InvalidUuidException } from "@/domain/shared/exception/invalid-uuid.exception";
import { AccountNotActivatedException } from "@/domain/user/exception/lifecycle/account-not-activated.exception";
import { ActivationLimitReachedException } from "@/domain/user/exception/rate-limit/activation-limit-reached.exception";
import { InvalidCredentialsException } from "@/domain/user/exception/security/invalid-credentials.exception";
import { InvalidRefreshTokenException } from "@/domain/user/exception/security/invalid-refresh-token.exception";
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
    exception: InvalidCredentialsException,
    toHttpException: (message) => new UnauthorizedException(message),
  },
  {
    exception: InvalidRefreshTokenException,
    toHttpException: (message) => new UnauthorizedException(message),
  },
  {
    exception: AccountNotActivatedException,
    toHttpException: (message) => new ForbiddenException(message),
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
