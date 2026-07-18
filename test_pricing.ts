import { getCloudPricing } from './src/tools/pricingLookup';

console.log(getCloudPricing({ resourceType: 'compute', instanceType: 'ecs_fargate:t3.medium' }));
