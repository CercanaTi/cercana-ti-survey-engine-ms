import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationResponse } from './entities/evaluation-response.entity';
import { QuestionResponse } from './entities/question-response.entity';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [TypeOrmModule.forFeature([EvaluationResponse, QuestionResponse]), QueueModule],
  controllers: [ResponsesController],
  providers: [ResponsesService],
  exports: [TypeOrmModule, ResponsesService],
})
export class ResponsesModule {}
