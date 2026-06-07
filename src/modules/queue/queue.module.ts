import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  SCORING_QUEUE,
  ANALYTICS_QUEUE,
  REPORTS_QUEUE,
  NOTIFICATIONS_QUEUE,
} from './queue.constants';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: SCORING_QUEUE },
      { name: ANALYTICS_QUEUE },
      { name: REPORTS_QUEUE },
      { name: NOTIFICATIONS_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
