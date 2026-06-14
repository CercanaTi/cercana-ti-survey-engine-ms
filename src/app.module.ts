import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { DatabaseConfig } from './config/database.config';
import { loggerConfig } from './config/logger.config';
import { appConfig } from './config/app.config';
import { redisConfig, isRedisEnabled } from './config/redis.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestTrackingMiddleware } from './common/middlewares/correlation-id.middleware';
import { InternalApiKeyGuard } from './common/guards/internal-api-key.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CommonModule } from './common/common.module';
import { ResponsesModule } from './modules/responses/responses.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ResultsModule } from './modules/results/results.module';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env.development', '.env'],
      load: [appConfig, redisConfig],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_LIMIT ?? '100', 10),
      },
    ]),

    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    ...(isRedisEnabled()
      ? [
          BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              connection: { url: configService.get<string>('redis.url') },
            }),
          }),
        ]
      : []),

    CommonModule,
    ResponsesModule,
    ScoringModule,
    AnalyticsModule,
    ReportsModule,
    ResultsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: InternalApiKeyGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTrackingMiddleware).forRoutes('*');
  }
}
