import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        response.status(status).json({
          statusCode: status,
          message: exceptionResponse,
          error: HttpStatus[status] ?? 'Error',
        });
        return;
      }

      const body = exceptionResponse as Record<string, unknown>;
      response.status(status).json({
        statusCode: status,
        message: body.message ?? exception.message,
        error:
          (body.error as string) ??
          HttpStatus[status]?.replace(/_/g, ' ') ??
          'Error',
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
