import { Injectable } from '@nestjs/common';
import { HttpClientService } from '../http/services/http-client.service';

@Injectable()
export class CommonHttpService {
  constructor(private readonly httpClient: HttpClientService) {}

  async get<T = any>(
    url: string,
    params: Record<string, string | string[]> = {},
    headers: Record<string, string> = {},
  ): Promise<T> {
    const response = await this.httpClient.get<T>(url, {
      params,
      headers,
    });
    return response.data;
  }

  async post<T = any>(
    url: string,
    data: any = {},
    headers: Record<string, string> = {},
  ): Promise<T> {
    const response = await this.httpClient.post<T>(url, data, {
      headers,
    });
    return response.data;
  }

  async put<T = any>(
    url: string,
    data: any = {},
    headers: Record<string, string> = {},
  ): Promise<T> {
    const response = await this.httpClient.put<T>(url, data, {
      headers,
    });
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data: any = {},
    headers: Record<string, string> = {},
  ): Promise<T> {
    const response = await this.httpClient.patch<T>(url, data, {
      headers,
    });
    return response.data;
  }

  async delete<T = any>(url: string, headers: Record<string, string> = {}): Promise<T> {
    const response = await this.httpClient.delete<T>(url, {
      headers,
    });
    return response.data;
  }
}
