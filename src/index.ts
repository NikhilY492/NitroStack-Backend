import 'reflect-metadata';
import { McpApplicationFactory } from '@nitrostack/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await McpApplicationFactory.create(AppModule);

  await app.listen();
}

bootstrap().catch(console.error);
