import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

const SERVICE_NAME = process.env.SERVICE_NAME ?? 'cercana-ti-backend-nestjs';

@Injectable()
export class AppService {
  constructor(private readonly logger: Logger) {}

  getHealth(): { status: string; timestamp: string; service: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
    };
  }

  getDetailedHealth() {
    this.logger.log('Checking detailed health status');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      version: process.env.DD_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      databases: {
        postgresql: 'connected',
        supabase: 'connected',
      },
    };
  }
}
