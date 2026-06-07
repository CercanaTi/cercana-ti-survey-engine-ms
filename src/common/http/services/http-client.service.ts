import { HttpRequestConfig, HttpResponse } from '../interfaces/http.interface';

export abstract class HttpClientService {
  abstract request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;

  async get<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      ...config,
    });
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config,
    });
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    });
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      ...config,
    });
  }

  async delete<T = any>(
    url: string,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }
}
