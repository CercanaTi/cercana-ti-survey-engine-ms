import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'X-Correlation-ID';
export const TRACE_ID_HEADER = 'X-Trace-ID';
export const REQUEST_ID_HEADER = 'X-Request-ID';

@Injectable()
export class RequestTrackingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = randomUUID();
    const traceId = randomUUID();

    req.headers[CORRELATION_ID_HEADER.toLowerCase()] = correlationId;
    req.headers[REQUEST_ID_HEADER.toLowerCase()] = correlationId;
    req.headers[TRACE_ID_HEADER.toLowerCase()] = traceId;

    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    res.setHeader(REQUEST_ID_HEADER, correlationId);
    res.setHeader(TRACE_ID_HEADER, traceId);

    next();
  }
}
