import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { LoggerService } from '../services/logger.service';

interface RequestMeta {
  requestId: string;
  method: string;
  url: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const meta: RequestMeta = { requestId: randomUUID(), method: request.method, url: request.url };
    request.requestId = meta.requestId;
    const startTime = Date.now();
    this.logIncomingRequest(meta, request);
    return next.handle().pipe(
      tap({
        next: (data) => this.logCompletedRequest(meta, response, data, startTime),
        error: (error) => this.logFailedRequest(meta, error, startTime),
      }),
    );
  }

  private logIncomingRequest(meta: RequestMeta, request: any): void {
    this.logger.log(`Incoming ${meta.method} ${meta.url}`, 'HTTP', {
      requestId: meta.requestId,
      method: meta.method,
      url: meta.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    });
  }

  private logCompletedRequest(
    meta: RequestMeta,
    response: any,
    data: any,
    startTime: number,
  ): void {
    const duration = Date.now() - startTime;
    this.logger.log(`Completed ${meta.method} ${meta.url} - ${response.statusCode}`, 'HTTP', {
      requestId: meta.requestId,
      method: meta.method,
      url: meta.url,
      statusCode: response.statusCode,
      duration,
      responseSize: JSON.stringify(data).length,
    });
  }

  private logFailedRequest(meta: RequestMeta, error: any, startTime: number): void {
    const duration = Date.now() - startTime;
    this.logger.error(`Failed ${meta.method} ${meta.url}`, error, 'HTTP', {
      requestId: meta.requestId,
      method: meta.method,
      url: meta.url,
      duration,
      errorMessage: error.message,
      errorStack: error.stack,
    });
  }
}
