import { HttpException, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { BaseApiService } from '../base-api.service';
import { CommonHttpService } from '../../../common/axios/common-http.service';
import { BaseServiceConfig } from '../../config/base-service.config';

class ConcreteApiService extends BaseApiService {
  constructor(httpService: CommonHttpService, config: BaseServiceConfig) {
    super(httpService, config);
  }

  callGet<T>(
    endpoint: string,
    params?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.get<T>(endpoint, params, headers, 'Test GET error');
  }

  callPost<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.post<T>(endpoint, data, headers, 'Test POST error');
  }

  callPut<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.put<T>(endpoint, data, headers, 'Test PUT error');
  }

  callPatch<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.patch<T>(endpoint, data, headers, 'Test PATCH error');
  }

  callDelete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.delete<T>(endpoint, headers, 'Test DELETE error');
  }
}

describe('BaseApiService', () => {
  let service: ConcreteApiService;
  let mockHttpService: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
  };

  const mockConfig = {
    baseUrl: 'https://api.example.com',
    authToken: undefined as string | undefined,
    timeout: 10000,
    getAuthHeaders: () => ({}),
  };

  const responseData = { id: 1, name: 'test' };

  beforeEach(() => {
    mockHttpService = {
      get: jest.fn().mockResolvedValue(responseData),
      post: jest.fn().mockResolvedValue(responseData),
      put: jest.fn().mockResolvedValue(responseData),
      patch: jest.fn().mockResolvedValue(responseData),
      delete: jest.fn().mockResolvedValue(responseData),
    };

    service = new ConcreteApiService(
      mockHttpService as unknown as CommonHttpService,
      mockConfig as unknown as BaseServiceConfig,
    );
  });

  describe('get', () => {
    it('should call httpService.get with correct url and return data', async () => {
      const result = await service.callGet<typeof responseData>('items');

      expect(result).toEqual(responseData);
      expect(mockHttpService.get).toHaveBeenCalledWith('https://api.example.com/items', {}, {});
    });

    it('should pass query params', async () => {
      await service.callGet('items', { page: 1 });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.example.com/items',
        { page: '1' },
        {},
      );
    });

    it('should throw ServiceUnavailableException on network error', async () => {
      mockHttpService.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.callGet('items')).rejects.toThrow(ServiceUnavailableException);
    });

    it('should rethrow HttpException unchanged', async () => {
      const httpErr = new HttpException('Not found', HttpStatus.NOT_FOUND);
      mockHttpService.get.mockRejectedValueOnce(httpErr);

      await expect(service.callGet('items')).rejects.toThrow(HttpException);
    });

    it('should handle axios-style error with 4xx response', async () => {
      const axiosError = {
        response: {
          status: 422,
          data: { message: 'Validation failed', error: 'UnprocessableEntity' },
        },
        message: 'Request failed',
      };
      mockHttpService.get.mockRejectedValueOnce(axiosError);

      await expect(service.callGet('items')).rejects.toThrow(HttpException);
    });
  });

  describe('post', () => {
    it('should call httpService.post with correct url and data', async () => {
      const result = await service.callPost('items', { name: 'new' });

      expect(result).toEqual(responseData);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.example.com/items',
        { name: 'new' },
        {},
      );
    });
  });

  describe('put', () => {
    it('should call httpService.put with correct url and data', async () => {
      const result = await service.callPut('items/1', { name: 'updated' });

      expect(result).toEqual(responseData);
      expect(mockHttpService.put).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        { name: 'updated' },
        {},
      );
    });
  });

  describe('patch', () => {
    it('should call httpService.patch with correct url and data', async () => {
      const result = await service.callPatch('items/1', { name: 'patched' });

      expect(result).toEqual(responseData);
      expect(mockHttpService.patch).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        { name: 'patched' },
        {},
      );
    });
  });

  describe('delete', () => {
    it('should call httpService.delete with correct url', async () => {
      const result = await service.callDelete('items/1');

      expect(result).toEqual(responseData);
      expect(mockHttpService.delete).toHaveBeenCalledWith('https://api.example.com/items/1', {});
    });
  });

  describe('url building', () => {
    it('should strip trailing slash from baseUrl and leading slash from endpoint', async () => {
      const configWithSlash = { ...mockConfig, baseUrl: 'https://api.example.com/' };
      const svc = new ConcreteApiService(
        mockHttpService as unknown as CommonHttpService,
        configWithSlash as unknown as BaseServiceConfig,
      );

      await svc.callGet('/items');

      expect(mockHttpService.get).toHaveBeenCalledWith('https://api.example.com/items', {}, {});
    });
  });

  describe('sanitizeParams', () => {
    it('should filter out undefined and null values from params', async () => {
      await service.callGet('items', { page: 1, status: null, filter: undefined });

      const calledWith = mockHttpService.get.mock.calls[0][1];
      expect(calledWith.page).toBe('1');
      expect(calledWith.status).toBeUndefined();
      expect(calledWith.filter).toBeUndefined();
    });

    it('should convert array values to string arrays', async () => {
      await service.callGet('items', { ids: [1, 2, 3] });

      const calledWith = mockHttpService.get.mock.calls[0][1];
      expect(calledWith.ids).toEqual(['1', '2', '3']);
    });
  });

  describe('error handling with string and object errors', () => {
    it('should handle string error message', async () => {
      mockHttpService.get.mockRejectedValueOnce('plain string error');

      await expect(service.callGet('items')).rejects.toThrow(ServiceUnavailableException);
    });

    it('should handle error object with message property', async () => {
      mockHttpService.get.mockRejectedValueOnce({ message: 'custom error' });

      await expect(service.callGet('items')).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
