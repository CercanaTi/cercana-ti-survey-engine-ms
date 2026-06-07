import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosHttpService } from '../axios-http.service';

describe('AxiosHttpService', () => {
  let service: AxiosHttpService;
  let mockHttpService: { request: jest.Mock };

  const mockResponse = { data: { id: 1 }, status: 200, statusText: 'OK' };

  beforeEach(() => {
    mockHttpService = { request: jest.fn().mockReturnValue(of(mockResponse)) };
    service = new AxiosHttpService(mockHttpService as unknown as HttpService);
  });

  describe('request', () => {
    it('should perform a GET request and return mapped response', async () => {
      const result = await service.request({ url: 'http://test.com/api', method: 'GET' });

      expect(result.data).toEqual(mockResponse.data);
      expect(result.status).toBe(200);
      expect(mockHttpService.request).toHaveBeenCalled();
    });

    it('should append query params to url', async () => {
      await service.request({
        url: 'http://test.com/api',
        method: 'GET',
        params: { key: 'value' },
      });

      const calledWith = mockHttpService.request.mock.calls[0][0];
      expect(calledWith.url).toContain('key=value');
    });

    it('should handle array query params', async () => {
      await service.request({
        url: 'http://test.com/api',
        method: 'GET',
        params: { ids: ['1', '2'] },
      });

      const calledWith = mockHttpService.request.mock.calls[0][0];
      expect(calledWith.url).toContain('ids=1');
      expect(calledWith.url).toContain('ids=2');
    });
  });

  describe('get', () => {
    it('should delegate to request with GET method', async () => {
      const result = await service.get('http://test.com/api');

      expect(result.status).toBe(200);
    });
  });

  describe('post', () => {
    it('should delegate to request with POST method and data', async () => {
      const result = await service.post('http://test.com/api', { name: 'test' });

      expect(result.status).toBe(200);
    });
  });

  describe('put', () => {
    it('should delegate to request with PUT method', async () => {
      const result = await service.put('http://test.com/api', { name: 'updated' });

      expect(result.status).toBe(200);
    });
  });

  describe('patch', () => {
    it('should delegate to request with PATCH method', async () => {
      const result = await service.patch('http://test.com/api', { name: 'patched' });

      expect(result.status).toBe(200);
    });
  });

  describe('delete', () => {
    it('should delegate to request with DELETE method', async () => {
      const result = await service.delete('http://test.com/api');

      expect(result.status).toBe(200);
    });
  });
});
