import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';

describe('AppController', () => {
  let controller: AppController;
  let mockAppService: { getHealth: jest.Mock; getDetailedHealth: jest.Mock };

  beforeEach(async () => {
    mockAppService = {
      getHealth: jest.fn().mockReturnValue({
        status: 'ok',
        timestamp: '2026-01-01T00:00:00.000Z',
        service: 'cercana-ti-backend-nestjs',
      }),
      getDetailedHealth: jest.fn().mockReturnValue({
        status: 'ok',
        timestamp: '2026-01-01T00:00:00.000Z',
        service: 'cercana-ti-backend-nestjs',
        version: '1.0.0',
        environment: 'test',
        uptime: 100,
        memory: {},
        databases: { postgresql: 'connected', supabase: 'connected' },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('ok');
      expect(mockAppService.getHealth).toHaveBeenCalled();
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health status', () => {
      const result = controller.getDetailedHealth();

      expect(result.status).toBe('ok');
      expect(mockAppService.getDetailedHealth).toHaveBeenCalled();
    });
  });
});
