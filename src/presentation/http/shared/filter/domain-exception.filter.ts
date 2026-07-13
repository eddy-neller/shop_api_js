import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from "@nestjs/common";
import type { HttpException } from "@nestjs/common";
import type { Response } from "express";
import { DomainException } from "@/domain/shared/exception/domain-exception";

export function writeHttpExceptionResponse(
  response: Response,
  httpException: HttpException,
): void {
  const status = httpException.getStatus();

  response.status(status).json({
    message: httpException.message,
    error: httpException.name,
    statusCode: status,
  });
}

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  public catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const httpException = this.toHttpException(exception);

    writeHttpExceptionResponse(response, httpException);
  }

  protected toHttpException(exception: DomainException): HttpException {
    return new BadRequestException(exception.message);
  }
}
