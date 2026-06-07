import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InternalApiKeyGuard } from '../internal-api-key.guard';

const buildContext = (headers: Record<string, string>): ExecutionContext =>
  ({
    getHandler: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  }) as unknown as ExecutionContext;

describe('InternalApiKeyGuard', () => {
  let guard: InternalApiKeyGuard;
  let reflector: { get: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    reflector = { get: jest.fn().mockReturnValue(false) };
    configService = { get: jest.fn().mockReturnValue('super-secret-internal-key') };
    guard = new InternalApiKeyGuard(
      reflector as unknown as Reflector,
      configService as unknown as ConfigService,
    );
  });

  it('allows the request when the header matches the configured key', () => {
    const context = buildContext({ 'x-internal-api-key': 'super-secret-internal-key' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws UnauthorizedException when the header is missing', () => {
    const context = buildContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the header does not match', () => {
    const context = buildContext({ 'x-internal-api-key': 'wrong-key' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('allows the request when the route is marked as public', () => {
    reflector.get.mockReturnValue(true);
    const context = buildContext({});

    expect(guard.canActivate(context)).toBe(true);
  });
});
