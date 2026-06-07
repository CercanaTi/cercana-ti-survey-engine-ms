import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from '../logging.interceptor';
import { LoggerService } from '../../services/logger.service';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  const mockLogger = { log: jest.fn(), error: jest.fn() };

  const buildContext = (method = 'GET', url = '/test', statusCode = 200): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          url,
          ip: '127.0.0.1',
          get: jest.fn().mockReturnValue('test-agent'),
        }),
        getResponse: () => ({ statusCode }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    interceptor = new LoggingInterceptor(mockLogger as unknown as LoggerService);
  });

  describe('intercept', () => {
    it('should log incoming request and completed response', (done) => {
      const context = buildContext();
      const handler: CallHandler = { handle: () => of({ message: 'ok' }) };

      interceptor.intercept(context, handler).subscribe({
        complete: () => {
          expect(mockLogger.log).toHaveBeenCalledTimes(2);
          done();
        },
      });
    });

    it('should log error when handler throws', (done) => {
      const context = buildContext();
      const error = new Error('Something failed');
      const handler: CallHandler = { handle: () => throwError(() => error) };

      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(mockLogger.error).toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
