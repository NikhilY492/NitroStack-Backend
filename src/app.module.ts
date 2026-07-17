import { Module } from '@nitrostack/core';
import { InfraModule } from './modules/infra/infra.module';

@Module({
  name: 'AppModule',
  imports: [InfraModule],
})
export class AppModule {}
