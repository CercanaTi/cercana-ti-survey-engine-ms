import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import { Logger } from 'nestjs-pino';

const DEFAULT_PORT = 3001;
const SWAGGER_PATH = 'api/docs';
const SERVICE_TITLE = 'SED-RD Engine API';
const SERVICE_DESCRIPTION = 'Teacher Evaluation System — Processing Engine Backend';
const SERVICE_VERSION = '1.0';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',');
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle(SERVICE_TITLE)
    .setDescription(SERVICE_DESCRIPTION)
    .setVersion(SERVICE_VERSION)
    .addApiKey({ type: 'apiKey', name: 'X-Internal-Api-Key', in: 'header' }, 'internal-api-key')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SWAGGER_PATH, app, document);

  const port = parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);

  app.enableShutdownHooks();

  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Application is running on port ${port}`);
  logger.log(
    `Swagger available at ${process.env.HOST ?? 'http://localhost'}:${port}/${SWAGGER_PATH}`,
  );

  process.on('SIGTERM', () => logger.log('Application shutting down'));
}

bootstrap();
