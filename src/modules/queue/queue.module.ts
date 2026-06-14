import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { isRedisEnabled } from '../../config/redis.config';
import {
  SCORING_QUEUE,
  ANALYTICS_QUEUE,
  REPORTS_QUEUE,
  NOTIFICATIONS_QUEUE,
} from './queue.constants';

const QUEUE_NAMES = [SCORING_QUEUE, ANALYTICS_QUEUE, REPORTS_QUEUE, NOTIFICATIONS_QUEUE];

const createNoopQueueProvider = (name: string) => ({
  provide: getQueueToken(name),
  useValue: {
    name,
    add: async () => undefined,
  },
});

@Module(
  isRedisEnabled()
    ? {
        imports: [
          BullModule.registerQueue(
            { name: SCORING_QUEUE },
            { name: ANALYTICS_QUEUE },
            { name: REPORTS_QUEUE },
            { name: NOTIFICATIONS_QUEUE },
          ),
        ],
        exports: [BullModule],
      }
    : {
        providers: QUEUE_NAMES.map(createNoopQueueProvider),
        exports: QUEUE_NAMES.map((name) => getQueueToken(name)),
      },
)
export class QueueModule {}
