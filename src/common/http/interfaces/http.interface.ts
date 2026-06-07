export interface HttpRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string | string[]>;
  data?: any;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}
