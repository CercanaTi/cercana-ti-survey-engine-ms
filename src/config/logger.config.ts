import { Params } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';

export const loggerConfig: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? 'info',

    base: {
      service: process.env.SERVICE_NAME ?? 'cercana-ti-survey-engine-ms',
      version: '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
    },

    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: false,
              messageKey: 'message',
              timestampKey: 'time',
              levelKey: 'level',
            },
          }
        : undefined,

    messageKey: 'message',

    customProps: (req: IncomingMessage) => ({
      correlationId: (req.headers['x-correlation-id'] ??
        req.headers['x-request-id'] ??
        '') as string,
      traceId: (req.headers['x-trace-id'] ?? '') as string,
    }),

    serializers: {
      req: (
        req: IncomingMessage & {
          ip?: string;
          connection?: { remoteAddress?: string };
          query?: unknown;
          params?: unknown;
        },
      ) => ({
        method: req.method,
        url: req.url,
        correlationId: req.headers['x-correlation-id'],
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
          'x-internal-api-key': req.headers['x-internal-api-key'] ? '[REDACTED]' : undefined,
        },
        query: req.query,
        params: req.params,
        ip: req.ip ?? req.connection?.remoteAddress,
      }),
      res: (res: ServerResponse & { getHeaders?: () => Record<string, unknown> }) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.getHeaders?.()?.['content-type'] ?? undefined,
        },
      }),
      err: (err: Error & { code?: string; statusCode?: number }) => ({
        type: err.constructor.name,
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        code: err.code,
        statusCode: err.statusCode,
      }),
    },

    autoLogging: true,
    quietReqLogger: false,

    customLogLevel: (
      req: IncomingMessage,
      res: ServerResponse,
      err?: Error,
    ): 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent' => {
      if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
      if (res.statusCode >= 500 || err) return 'error';
      return 'info';
    },

    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },

    customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) => {
      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },

    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-internal-api-key"]',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        'req.body.secret',
        'res.headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },
  },
};
