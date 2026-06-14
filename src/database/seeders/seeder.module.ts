import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../../datasource';
import { EvaluationResponse } from '../../modules/responses/entities/evaluation-response.entity';
import { QuestionResponse } from '../../modules/responses/entities/question-response.entity';
import { EvaluationResult } from '../../modules/results/entities/evaluation-result.entity';
import { SectionResult } from '../../modules/results/entities/section-result.entity';
import { ResponseSeeder, MockDataEngineCommand } from './responses.seeder';
import { CleanupMockDataEngineCommand } from './cleanup-mock-data.command';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
    }),
    TypeOrmModule.forFeature([
      EvaluationResponse,
      QuestionResponse,
      EvaluationResult,
      SectionResult,
    ]),
  ],
  providers: [ResponseSeeder, MockDataEngineCommand, CleanupMockDataEngineCommand],
})
export class SeederModule {}
