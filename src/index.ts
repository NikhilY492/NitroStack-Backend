process.env.NITROSTACK_APP_MODE = 'openai'; // Lock to OpenAI Apps SDK mode
import 'reflect-metadata';
import { McpApplicationFactory } from '@nitrostack/core';
import { Application } from './app.module';

async function bootstrap() {
  const app = await McpApplicationFactory.create(Application);

  await app.start();
}

bootstrap().catch(console.error);
