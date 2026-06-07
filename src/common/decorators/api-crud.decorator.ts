import { applyDecorators, Type } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function ApiCrudOperation(
  operation: 'create' | 'findAll' | 'findOne' | 'update' | 'delete' | 'restore',
  entityName: string,
  entityClass?: Type<any>,
) {
  const operations = {
    create: {
      summary: `Create a new ${entityName.toLowerCase()}`,
      responses: [
        {
          status: 201,
          description: `${entityName} created successfully`,
          type: entityClass,
        },
        { status: 400, description: 'Invalid input data' },
        { status: 401, description: 'Unauthorized' },
      ],
    },
    findAll: {
      summary: `Get all ${entityName.toLowerCase()}s`,
      responses: [
        {
          status: 200,
          description: `List of ${entityName.toLowerCase()}s retrieved successfully`,
          ...(entityClass && { type: entityClass, isArray: true }),
        },
        { status: 401, description: 'Unauthorized' },
      ],
    },
    findOne: {
      summary: `Get a ${entityName.toLowerCase()} by ID`,
      responses: [
        {
          status: 200,
          description: `${entityName} retrieved successfully`,
          type: entityClass,
        },
        { status: 404, description: `${entityName} not found` },
        { status: 401, description: 'Unauthorized' },
      ],
    },
    update: {
      summary: `Update a ${entityName.toLowerCase()}`,
      responses: [
        {
          status: 200,
          description: `${entityName} updated successfully`,
          type: entityClass,
        },
        { status: 404, description: `${entityName} not found` },
        { status: 400, description: 'Invalid input data' },
        { status: 401, description: 'Unauthorized' },
      ],
    },
    delete: {
      summary: `Delete a ${entityName.toLowerCase()}`,
      responses: [
        { status: 204, description: `${entityName} deleted successfully` },
        { status: 404, description: `${entityName} not found` },
        { status: 401, description: 'Unauthorized' },
      ],
    },
    restore: {
      summary: `Restore a deleted ${entityName.toLowerCase()}`,
      responses: [
        {
          status: 200,
          description: `${entityName} restored successfully`,
          type: entityClass,
        },
        { status: 404, description: `${entityName} not found` },
        { status: 401, description: 'Unauthorized' },
      ],
    },
  };

  const config = operations[operation];

  return applyDecorators(
    ApiOperation({ summary: config.summary }),
    ...config.responses.map((response) => ApiResponse(response)),
  );
}

export function ApiFindByIdentification(entityName: string, entityClass?: Type<any>) {
  return applyDecorators(
    ApiOperation({
      summary: `Get a ${entityName.toLowerCase()} by identification`,
    }),
    ApiParam({
      name: 'identification',
      description: `${entityName} identification number`,
      example: '12345678901',
    }),
    ApiResponse({
      status: 200,
      description: `${entityName} retrieved successfully`,
      type: entityClass,
    }),
    ApiResponse({ status: 404, description: `${entityName} not found` }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiPaginatedResponse(entityName: string, entityClass?: Type<any>) {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: `Paginated list of ${entityName.toLowerCase()}s`,
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: entityClass
              ? { $ref: `#/components/schemas/${entityClass.name}` }
              : { type: 'object' },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              total: { type: 'number', example: 100 },
              totalPages: { type: 'number', example: 10 },
            },
          },
        },
      },
    }),
  );
}
