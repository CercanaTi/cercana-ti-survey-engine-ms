import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Customer } from '../modules/customer/entities/customer.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const provider = this.configService.get<string>('DB_PROVIDER') || 'typeorm';

    if (provider === 'supabase') {
      const url = this.configService.get<string>('DATABASE_URL');
      if (!url) {
        throw new Error(
          'DB_PROVIDER is set to "supabase" but DATABASE_URL is also required ' +
            'by TypeORM for schema management. Add DATABASE_URL to your .env.',
        );
      }
      return {
        type: 'postgres',
        url,
        entities: [Customer],
        migrations: ['dist/migrations/*.js'],
        migrationsRun: false,
        synchronize: false,
        logging: false,
        ssl: { rejectUnauthorized: false },
      };
    }

    return {
      type: 'postgres',
      url: this.configService.get<string>('DATABASE_URL'),
      entities: [Customer],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: false,
      synchronize: this.configService.get<string>('NODE_ENV') === 'development',
      logging: this.configService.get<string>('NODE_ENV') === 'development',
      ssl:
        this.configService.get<string>('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
    };
  }
}
