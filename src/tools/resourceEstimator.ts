import { EstimateResourceInput, ResourceEstimate, WorkloadClassification } from '../types/state';

/**
 * Heuristic resource estimator.
 * Maps workload description keywords + user count to rough capacity numbers.
 * Intentionally rough — sizing is approximate for MVP.
 *
 * No AI reasoning here — pure lookup table logic.
 */

interface SizeProfile {
  cpu: string;
  memory: string;
  storageGrowthPerMonth: string;
  rpsPerThousandUsers: number;
}

const workloadProfiles: Record<WorkloadClassification, SizeProfile> = {
  'cpu-intensive': { cpu: '4 vCPU', memory: '8GB',  storageGrowthPerMonth: '20GB/month',  rpsPerThousandUsers: 2   },
  'io-bound':      { cpu: '1 vCPU', memory: '2GB',  storageGrowthPerMonth: '50GB/month',  rpsPerThousandUsers: 10  },
  'batch':         { cpu: '8 vCPU', memory: '16GB', storageGrowthPerMonth: '200GB/month', rpsPerThousandUsers: 0.5 },
  'event-driven':  { cpu: '1 vCPU', memory: '1GB',  storageGrowthPerMonth: '10GB/month',  rpsPerThousandUsers: 5   },
  'production':    { cpu: '2 vCPU', memory: '4GB',  storageGrowthPerMonth: '50GB/month',  rpsPerThousandUsers: 3   },
  'medium-scale':  { cpu: '2 vCPU', memory: '4GB',  storageGrowthPerMonth: '50GB/month',  rpsPerThousandUsers: 3   },
  'small-scale':   { cpu: '1 vCPU', memory: '2GB',  storageGrowthPerMonth: '10GB/month',  rpsPerThousandUsers: 1   },
  'large-scale':   { cpu: '8 vCPU', memory: '16GB', storageGrowthPerMonth: '200GB/month', rpsPerThousandUsers: 10  },
};

const DEFAULT_PROFILE = workloadProfiles['medium-scale'];

function detectClassification(description: string): WorkloadClassification {
  const lower = description.toLowerCase();
  if (lower.includes('image') || lower.includes('video') || lower.includes('ml') || lower.includes('process'))
    return 'cpu-intensive';
  if (lower.includes('upload') || lower.includes('file') || lower.includes('s3') || lower.includes('storage'))
    return 'io-bound';
  if (lower.includes('batch') || lower.includes('etl') || lower.includes('pipeline'))
    return 'batch';
  if (lower.includes('event') || lower.includes('webhook') || lower.includes('queue'))
    return 'event-driven';
  return 'medium-scale';
}

export function estimateResourceRequirements(input: EstimateResourceInput): ResourceEstimate {
  const { workloadDescription, expectedUsers } = input;

  if (!workloadDescription || workloadDescription.trim().length < 5) {
    throw new Error('INSUFFICIENT_DESCRIPTION: workload description is too vague to estimate resources');
  }

  const classification = detectClassification(workloadDescription);
  const profile = workloadProfiles[classification] ?? DEFAULT_PROFILE;

  const expectedRps = Math.ceil((expectedUsers / 1000) * profile.rpsPerThousandUsers);

  return {
    cpu: profile.cpu,
    memory: profile.memory,
    storageGrowth: profile.storageGrowthPerMonth,
    expectedRps,
  };
}
