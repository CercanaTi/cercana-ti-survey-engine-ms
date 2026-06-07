import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { initializeTracing } from './config/tracing.config';
import helmet from 'helmet';
import * as compression from 'compression';
import { Logger } from 'nestjs-pino';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();

  initializeTracing();

  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('cercana-ti Backend API')
      .setDescription('NestJS microservices template')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
