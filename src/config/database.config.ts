import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      url: this.configService.getOrThrow<string>('DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
      synchronize: false,
      logging: ['error', 'warn'],
      migrations: ['dist/migrations/*.js'],
      entities: ['dist/**/*.entity.js'],
      extra: { max: 10 },
    };
  }
}
