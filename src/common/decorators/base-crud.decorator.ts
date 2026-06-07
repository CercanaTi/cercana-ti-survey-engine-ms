import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

export function ApiCrudController(tag: string) {
  const decorators = [ApiTags(tag)];

  return applyDecorators(...decorators);
}
