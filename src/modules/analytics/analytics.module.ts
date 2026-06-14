import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationResult } from '../results/entities/evaluation-result.entity';
import { SectionResult } from '../results/entities/section-result.entity';
import { QueueModule } from '../queue/queue.module';
import { AdminClientModule } from '../admin-client/admin-client.module';
import { isRedisEnabled } from '../../config/redis.config';
import { NodeAnalyticsSummary } from './entities/node-analytics-summary.entity';
import { TeacherProgressSummary } from './entities/teacher-progress-summary.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from './analytics.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NodeAnalyticsSummary,
      TeacherProgressSummary,
      EvaluationResult,
      SectionResult,
    ]),
    QueueModule,
    AdminClientModule,
  ],
  providers: [AnalyticsService, ...(isRedisEnabled() ? [AnalyticsProcessor] : [])],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
