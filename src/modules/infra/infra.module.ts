import { Module } from '@nitrostack/core';
import { InfraTools } from './infra.tools';

@Module({
  name: 'infra',
  controllers: [InfraTools],
})
export class InfraModule {}
