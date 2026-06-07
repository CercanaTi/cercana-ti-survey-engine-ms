import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiResponseOptions } from '@nestjs/swagger';

export interface ApiAnalyticsEndpointOptions {
  summary: string;
  description?: string;
  responseType?: any;
  additionalResponses?: ApiResponseOptions[];
}

export function ApiAnalyticsEndpoint(options: ApiAnalyticsEndpointOptions) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Analytics data retrieved successfully',
      type: options.responseType,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized access',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Insufficient permissions',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid request parameters',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  ];

  if (options.additionalResponses) {
    decorators.push(...options.additionalResponses.map((response) => ApiResponse(response)));
  }

  return applyDecorators(...decorators);
}

export function ApiCrudEndpoint(options: {
  summary: string;
  description?: string;
  responseType?: any;
  operation: 'create' | 'read' | 'update' | 'delete';
}) {
  const statusMap = {
    create: HttpStatus.CREATED,
    read: HttpStatus.OK,
    update: HttpStatus.OK,
    delete: HttpStatus.NO_CONTENT,
  };

  const descriptionMap = {
    create: 'Resource created successfully',
    read: 'Resource retrieved successfully',
    update: 'Resource updated successfully',
    delete: 'Resource deleted successfully',
  };

  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiResponse({
      status: statusMap[options.operation],
      description: descriptionMap[options.operation],
      type: options.responseType,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized access',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Insufficient permissions',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid request parameters',
    }),
  );
}
