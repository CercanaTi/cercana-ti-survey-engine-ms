import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SCORING_QUEUE, REPORTS_QUEUE } from './queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: SCORING_QUEUE }, { name: REPORTS_QUEUE })],
  exports: [BullModule],
})
export class QueueModule {}
