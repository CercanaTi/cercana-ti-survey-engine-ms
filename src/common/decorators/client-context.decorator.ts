import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { extractRequestContext, RequestContext } from '../interfaces/request-context.interface';

export const ClientContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return extractRequestContext(request);
  },
);
