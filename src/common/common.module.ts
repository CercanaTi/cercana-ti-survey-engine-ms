import { Module } from '@nestjs/common';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LoggerService } from './services/logger.service';

@Module({
  providers: [LoggingInterceptor, LoggerService],
  exports: [LoggingInterceptor, LoggerService],
})
export class CommonModule {}
