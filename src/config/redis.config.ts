import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  scoringConcurrency: parseInt(process.env.BULL_CONCURRENCY_SCORING ?? '5', 10),
  reportsConcurrency: parseInt(process.env.BULL_CONCURRENCY_REPORTS ?? '2', 10),
}));
