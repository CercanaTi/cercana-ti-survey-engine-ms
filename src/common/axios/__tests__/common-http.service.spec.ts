import { CommonHttpService } from '../common-http.service';
import { HttpClientService } from '../../http/services/http-client.service';

describe('CommonHttpService', () => {
  let service: CommonHttpService;
  let mockHttpClient: Record<string, jest.Mock>;

  const responsePayload = { id: 1 };

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn().mockResolvedValue({ data: responsePayload }),
      post: jest.fn().mockResolvedValue({ data: responsePayload }),
      put: jest.fn().mockResolvedValue({ data: responsePayload }),
      patch: jest.fn().mockResolvedValue({ data: responsePayload }),
      delete: jest.fn().mockResolvedValue({ data: responsePayload }),
    };
    service = new CommonHttpService(mockHttpClient as unknown as HttpClientService);
  });

  describe('get', () => {
    it('should call httpClient.get and return response data', async () => {
      const result = await service.get(
        'http://test.com/api',
        { page: '1' },
        { Authorization: 'Bearer token' },
      );

      expect(result).toEqual(responsePayload);
      expect(mockHttpClient.get).toHaveBeenCalledWith('http://test.com/api', {
        params: { page: '1' },
        headers: { Authorization: 'Bearer token' },
      });
    });
  });

  describe('post', () => {
    it('should call httpClient.post and return response data', async () => {
      const result = await service.post('http://test.com/api', { name: 'test' });

      expect(result).toEqual(responsePayload);
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
  });

  describe('put', () => {
    it('should call httpClient.put and return response data', async () => {
      const result = await service.put('http://test.com/api', { name: 'updated' });

      expect(result).toEqual(responsePayload);
    });
  });

  describe('patch', () => {
    it('should call httpClient.patch and return response data', async () => {
      const result = await service.patch('http://test.com/api', { name: 'patched' });

      expect(result).toEqual(responsePayload);
    });
  });

  describe('delete', () => {
    it('should call httpClient.delete and return response data', async () => {
      const result = await service.delete('http://test.com/api');

      expect(result).toEqual(responsePayload);
    });
  });
});
