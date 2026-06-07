import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationResponse } from '../responses/entities/evaluation-response.entity';
import { QuestionResponse } from '../responses/entities/question-response.entity';
import { EvaluationResult } from '../results/entities/evaluation-result.entity';
import { SectionResult } from '../results/entities/section-result.entity';
import { ManualReviewTask } from '../results/entities/manual-review-task.entity';
import { QueueModule } from '../queue/queue.module';
import { AdminClientModule } from '../admin-client/admin-client.module';
import { ScoringService } from './scoring.service';
import { ScoringProcessor } from './scoring.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EvaluationResponse,
      QuestionResponse,
      EvaluationResult,
      SectionResult,
      ManualReviewTask,
    ]),
    QueueModule,
    AdminClientModule,
  ],
  providers: [ScoringService, ScoringProcessor],
  exports: [ScoringService],
})
export class ScoringModule {}
