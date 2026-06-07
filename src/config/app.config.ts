import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
  rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10) * 1000,
  rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT ?? '100', 10),
  internalApiKey: process.env.INTERNAL_API_KEY ?? '',
  adminServiceUrl: process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3000',
  reportExpirationHours: parseInt(process.env.REPORT_EXPIRATION_HOURS ?? '24', 10),
  storageBucketReports: process.env.STORAGE_BUCKET_REPORTS ?? 'sed-rd-reports',
}));
