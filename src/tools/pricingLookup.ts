import * as fs from 'fs';
import * as path from 'path';
import { GetCloudPricingInput, GetCloudPricingOutput } from '../types/state';

interface PricingData {
  compute: Record<string, Record<string, { monthlyCost: number }>>;
  database: Record<string, Record<string, { monthlyCost: number }>>;
  cache: Record<string, Record<string, { monthlyCost: number }>>;
}

let pricingCache: PricingData | null = null;

function loadPricing(): PricingData {
  if (pricingCache) return pricingCache;

  const pricingPath = path.resolve(
    process.env.KNOWLEDGE_BASE_PATH ?? './knowledge',
    'pricing.json'
  );
  const raw = fs.readFileSync(pricingPath, 'utf-8');
  pricingCache = JSON.parse(raw) as PricingData;
  return pricingCache;
}

/**
 * Looks up monthly cost for a single resource from the static pricing table.
 *
 * resourceType: 'compute' | 'database' | 'cache'
 * instanceType: the specific instance/tier key (e.g. 't4g.medium')
 *
 * For database, instanceType maps to the service type ('postgresql', 'dynamodb')
 * suffixed by an underscore and instance size (e.g. 'postgresql_t3.medium').
 * We parse accordingly.
 */
export function getCloudPricing(input: GetCloudPricingInput): GetCloudPricingOutput {
  const pricing = loadPricing();
  const { resourceType, instanceType } = input;

  const category = pricing[resourceType];
  if (!category) {
    throw new Error(`UNKNOWN_RESOURCE_TYPE: ${resourceType}`);
  }

  // For compute: look up by compute type (ecs_fargate, ec2, lambda) + instance
  // The caller passes instanceType as "computeType:instanceSize", e.g. "ecs_fargate:t4g.medium"
  // For database/cache: instanceType is "dbType:instanceSize", e.g. "postgresql:t4g.medium"
  const [serviceKey, sizeKey] = instanceType.includes(':')
    ? instanceType.split(':')
    : [Object.keys(category)[0], instanceType];

  const serviceTable = category[serviceKey];
  if (!serviceTable) {
    throw new Error(`UNKNOWN_INSTANCE_TYPE: ${serviceKey} not in ${resourceType} catalog`);
  }

  const entry = serviceTable[sizeKey];
  if (!entry) {
    throw new Error(`UNKNOWN_INSTANCE_TYPE: ${sizeKey} not found in ${serviceKey} pricing`);
  }

  return {
    monthlyCost: entry.monthlyCost,
    unit: 'INR/month',
  };
}
