import { Params } from 'nestjs-pino';
import { Request } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

export const loggerConfig: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL || 'info',

    base: {
      service: process.env.DD_SERVICE,
      version: process.env.DD_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
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

    customProps: (req: Request) => ({
      correlationId: req.headers['x-correlation-id'] || req.headers['x-request-id'] || '',
      traceId: req.headers['x-trace-id'] || '',
    }),

    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        correlationId: req.headers['x-correlation-id'],
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
          authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        },
        query: req.query,
        params: req.params,
        ip: req.ip || req.connection?.remoteAddress,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type':
            res.headers?.['content-type'] || res.getHeaders?.()?.['content-type'] || undefined,
        },
      }),
      err: (err) => ({
        type: err.constructor.name,
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        code: err.code,
        statusCode: err.statusCode,
      }),
    },

    autoLogging: true,
    quietReqLogger: false,

    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 300 && res.statusCode < 400) return 'info';
      return 'info';
    },

    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },

    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },

    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        'req.body.secret',
        'res.headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },

    ...(process.env.NODE_ENV !== 'production' && {
      prettyPrint: false,
    }),
  },
};
