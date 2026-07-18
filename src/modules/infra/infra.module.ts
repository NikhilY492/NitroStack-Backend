import { Module } from '@nitrostack/core';
import { InfraTools } from './infra.tools';
import { CoordinatorPrompts } from './coordinator.prompts';

@Module({
  name: 'infra',
  controllers: [InfraTools, CoordinatorPrompts],
})
export class InfraModule {}
