import { ServiceUnavailableException, HttpException, HttpStatus } from '@nestjs/common';
import { CommonHttpService } from '../axios/common-http.service';
import { BaseServiceConfig } from '../config/base-service.config';

export abstract class BaseApiService {
  protected constructor(
    protected readonly httpService: CommonHttpService,
    protected readonly config: BaseServiceConfig,
  ) {}

  protected async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    additionalHeaders?: Record<string, string>,
    errorContext?: string,
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(additionalHeaders);
    const queryParams = this.sanitizeParams(params);

    return this.executeWithErrorHandling(
      () => this.httpService.get<T>(url, queryParams, headers),
      errorContext || `Failed to GET ${endpoint}`,
    );
  }

  protected async post<T>(
    endpoint: string,
    data?: any,
    additionalHeaders?: Record<string, string>,
    errorContext?: string,
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(additionalHeaders);

    return this.executeWithErrorHandling(
      () => this.httpService.post<T>(url, data, headers),
      errorContext || `Failed to POST ${endpoint}`,
    );
  }

  protected async put<T>(
    endpoint: string,
    data?: any,
    additionalHeaders?: Record<string, string>,
    errorContext?: string,
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(additionalHeaders);

    return this.executeWithErrorHandling(
      () => this.httpService.put<T>(url, data, headers),
      errorContext || `Failed to PUT ${endpoint}`,
    );
  }

  protected async patch<T>(
    endpoint: string,
    data?: any,
    additionalHeaders?: Record<string, string>,
    errorContext?: string,
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(additionalHeaders);

    return this.executeWithErrorHandling(
      () => this.httpService.patch<T>(url, data, headers),
      errorContext || `Failed to PATCH ${endpoint}`,
    );
  }

  protected async delete<T>(
    endpoint: string,
    additionalHeaders?: Record<string, string>,
    errorContext?: string,
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(additionalHeaders);

    return this.executeWithErrorHandling(
      () => this.httpService.delete<T>(url, headers),
      errorContext || `Failed to DELETE ${endpoint}`,
    );
  }

  private buildUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    return `${baseUrl}/${cleanEndpoint}`;
  }

  private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.config.getAuthHeaders(this.config.authToken),
      ...additionalHeaders,
    };
  }

  private sanitizeParams(params?: Record<string, any>): Record<string, string | string[]> {
    if (!params) return {};

    const sanitized: Record<string, string | string[]> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          sanitized[key] = value.map(String);
        } else {
          sanitized[key] = String(value);
        }
      }
    });

    return sanitized;
  }

  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      this.handleHttpError(error, errorMessage);
    }
  }

  private handleHttpError(error: unknown, context: string): never {
    if (error instanceof HttpException) {
      throw error;
    }
    if (this.isAxiosError(error) && error.response) {
      this.handleDownstreamError(
        error as { response: { status: number; data: any }; message: string },
      );
    }
    const message = this.extractErrorMessage(error);
    throw new ServiceUnavailableException({
      message: `${context}: ${message}`,
      error: 'Service Unavailable',
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    });
  }

  private handleDownstreamError(error: {
    response: { status: number; data: any };
    message: string;
  }): void {
    const { status, data } = error.response;
    const message = data?.message || this.extractErrorMessage(error);
    const errorType = data?.error || 'Error';
    if (status >= 400) {
      throw new HttpException({ message, error: errorType, statusCode: status }, status);
    }
  }

  private isAxiosError(error: unknown): error is {
    response?: { status: number; data: any };
    message: string;
  } {
    return typeof error === 'object' && error !== null && 'response' in error;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }

    return 'Unknown error occurred';
  }
}
