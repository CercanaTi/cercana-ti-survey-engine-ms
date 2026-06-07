import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ServiceConfig {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
}

@Injectable()
export abstract class BaseServiceConfig {
  constructor(protected readonly configService: ConfigService) {}

  protected getServiceConfig(serviceName: string, defaultUrl: string): ServiceConfig {
    const upperServiceName = serviceName.toUpperCase().replace('-', '_');

    return {
      baseUrl: this.configService.get<string>(`${upperServiceName}_BASE_URL`) || defaultUrl,
      authToken: this.configService.get<string>(`${upperServiceName}_AUTH_TOKEN`),
      timeout: parseInt(
        this.configService.get<string>(`${upperServiceName}_TIMEOUT`) || '10000',
        10,
      ),
    };
  }

  getAuthHeaders(token?: string): Record<string, string> {
    if (!token) {
      return {};
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  abstract get baseUrl(): string;
  abstract get authToken(): string | undefined;
  abstract get timeout(): number;
}
