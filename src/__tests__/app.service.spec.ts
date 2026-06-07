import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../app.service';
import { Logger } from 'nestjs-pino';

describe('AppService', () => {
  let service: AppService;
  let mockLogger: { log: jest.Mock };

  beforeEach(async () => {
    mockLogger = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService, { provide: Logger, useValue: mockLogger }],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('getHealth', () => {
    it('should return health status with timestamp and service name', () => {
      const result = service.getHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('cercana-ti-backend-nestjs');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health including uptime and memory', () => {
      const result = service.getDetailedHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('cercana-ti-backend-nestjs');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.memory).toBeDefined();
      expect(result.databases.postgresql).toBe('connected');
      expect(result.databases.supabase).toBe('connected');
    });

    it('should log a message during detailed health check', () => {
      service.getDetailedHealth();

      expect(mockLogger.log).toHaveBeenCalledWith('Checking detailed health status');
    });
  });
});
