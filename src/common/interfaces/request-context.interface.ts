import { Request } from 'express';

export interface RequestContext {
  correlationId: string;
  appId: string;
  casId: string;
  clientApp: string;
  authorization: string;
}

export function extractRequestContext(req: Request): RequestContext {
  return {
    correlationId: (req.headers['x-correlation-id'] as string) || '',
    appId: (req.headers['x-app-id'] as string) || '',
    casId: (req.headers['x-cas-id'] as string) || '',
    clientApp: (req.headers['x-client-app'] as string) || '',
    authorization: (req.headers['authorization'] as string) || '',
  };
}
