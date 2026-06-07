import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { HttpRequestConfig, HttpResponse } from '../interfaces/http.interface';

@Injectable()
export class AxiosHttpService extends HttpClientService {
  constructor(private readonly httpService: HttpService) {
    super();
  }

  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const { url, method, headers = {}, params = {}, data } = config;

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    });

    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

    const response = await firstValueFrom(
      this.httpService.request({
        url: fullUrl,
        method: method.toLowerCase() as any,
        headers,
        data,
      }),
    );

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  }
}
