import { Module, McpApp } from '@nitrostack/core';
import { InfraModule } from './modules/infra/infra.module';

@Module({
  name: 'AppModule',
  imports: [InfraModule],
  providers: [{ provide: 'OAUTH_CONFIG', useValue: { resourceUri: 'http://localhost:3000', authorizationServers: ['http://localhost:3000'] } }],
})
export class AppModule {}

@McpApp({
  module: AppModule,
  server: { name: 'shift-left-finops', version: '1.0.0' },
  transport: {
    type: 'http',
    http: { port: 3000 }
  }
})
export class Application {}
