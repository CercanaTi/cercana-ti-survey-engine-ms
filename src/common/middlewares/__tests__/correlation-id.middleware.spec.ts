import { Request, Response } from 'express';
import {
  RequestTrackingMiddleware,
  CORRELATION_ID_HEADER,
  TRACE_ID_HEADER,
  REQUEST_ID_HEADER,
} from '../correlation-id.middleware';

describe('RequestTrackingMiddleware', () => {
  let middleware: RequestTrackingMiddleware;

  beforeEach(() => {
    middleware = new RequestTrackingMiddleware();
  });

  it('should set correlation, trace, and request ID headers on request and response', () => {
    const req = { headers: {} } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers[CORRELATION_ID_HEADER.toLowerCase()]).toBeDefined();
    expect(req.headers[TRACE_ID_HEADER.toLowerCase()]).toBeDefined();
    expect(req.headers[REQUEST_ID_HEADER.toLowerCase()]).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith(TRACE_ID_HEADER, expect.any(String));
    expect(next).toHaveBeenCalled();
  });

  it('should generate unique IDs on each invocation', () => {
    const req1 = { headers: {} } as unknown as Request;
    const req2 = { headers: {} } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn();

    middleware.use(req1, res, next);
    middleware.use(req2, res, next);

    expect(req1.headers[CORRELATION_ID_HEADER.toLowerCase()]).not.toBe(
      req2.headers[CORRELATION_ID_HEADER.toLowerCase()],
    );
  });
});
