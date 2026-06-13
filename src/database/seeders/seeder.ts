import { CommandFactory } from 'nest-commander';
import { SeederModule } from './seeder.module';

async function bootstrap() {
  await CommandFactory.run(SeederModule, { logger: ['error', 'warn', 'log'] });
}

bootstrap();
