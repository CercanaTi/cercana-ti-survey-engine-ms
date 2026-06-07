import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EvaluationResult } from './entities/evaluation-result.entity';
import { SectionResult } from './entities/section-result.entity';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EvaluationResult, SectionResult]), AnalyticsModule],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
