import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EvaluationResult } from '../results/entities/evaluation-result.entity';
import { SectionResult } from '../results/entities/section-result.entity';
import { NodeAnalyticsSummary } from '../analytics/entities/node-analytics-summary.entity';
import { QueueModule } from '../queue/queue.module';
import { REPORTS_QUEUE } from '../queue/queue.constants';
import { AdminClientModule } from '../admin-client/admin-client.module';
import { ReportRequest } from './entities/report-request.entity';
import { ReportsService } from './reports.service';
import { ReportsProcessor } from './reports.processor';
import { ReportsController } from './reports.controller';
import { CLEANUP_CRON_PATTERN, CLEANUP_JOB_NAME } from './constants/reports.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportRequest,
      EvaluationResult,
      SectionResult,
      NodeAnalyticsSummary,
    ]),
    QueueModule,
    AdminClientModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsProcessor],
  exports: [ReportsService],
})
export class ReportsModule implements OnModuleInit {
  constructor(@InjectQueue(REPORTS_QUEUE) private readonly reportsQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.reportsQueue.add(
      CLEANUP_JOB_NAME,
      {},
      { repeat: { pattern: CLEANUP_CRON_PATTERN }, jobId: CLEANUP_JOB_NAME },
    );
  }
}
