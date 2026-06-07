import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ApiCrudOperation, ApiFindByIdentification } from './api-crud.decorator';

export function ApiPaginationQueries() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (starting from 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
      example: 10,
    }),
  );
}

export function ApiStatusFilter(statusEnum: any, entityName: string) {
  return ApiQuery({
    name: 'status',
    required: false,
    enum: statusEnum,
    description: `Filter by ${entityName.toLowerCase()} status`,
  });
}

export function ApiIdParam(entityName: string = 'Entity') {
  return applyDecorators(
    ApiQuery({
      name: 'id',
      description: `${entityName} UUID`,
      type: 'string',
    }),
  );
}

export function ApiStandardCrud(entityName: string, entityClass: any, statusEnum?: any) {
  return {
    create: () => applyDecorators(ApiCrudOperation('create', entityName, entityClass)),
    findAll: () =>
      applyDecorators(
        ApiCrudOperation('findAll', entityName, entityClass),
        ApiPaginationQueries(),
        ...(statusEnum ? [ApiStatusFilter(statusEnum, entityName)] : []),
      ),
    findOne: () =>
      applyDecorators(ApiCrudOperation('findOne', entityName, entityClass), ApiIdParam(entityName)),
    update: () =>
      applyDecorators(ApiCrudOperation('update', entityName, entityClass), ApiIdParam(entityName)),
    delete: () => applyDecorators(ApiCrudOperation('delete', entityName), ApiIdParam(entityName)),
    restore: () =>
      applyDecorators(ApiCrudOperation('restore', entityName, entityClass), ApiIdParam(entityName)),
  };
}

export { ApiCrudOperation, ApiFindByIdentification };
