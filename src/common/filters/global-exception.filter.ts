import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  correlationId: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.resolveMessage(exception);
    const error = this.resolveError(exception, statusCode);
    const correlationId = (request.headers['x-correlation-id'] as string) ?? '';

    this.logger.error(
      { statusCode, path: request.url, method: request.method, correlationId },
      message,
    );

    const body: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    };

    response.status(statusCode).json(body);
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null) {
        const res = response as Record<string, unknown>;
        if (Array.isArray(res['message'])) return (res['message'] as string[]).join(', ');
        if (typeof res['message'] === 'string') return res['message'];
      }
    }
    if (exception instanceof Error) return exception.message;
    return 'Internal server error';
  }

  private resolveError(exception: unknown, statusCode: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const res = response as Record<string, unknown>;
        if (typeof res['error'] === 'string') return res['error'];
      }
    }
    return HttpStatus[statusCode] ?? 'INTERNAL_SERVER_ERROR';
  }
}
