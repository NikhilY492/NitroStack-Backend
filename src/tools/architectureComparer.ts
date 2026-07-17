import {
  CompareArchitecturesInput,
  CompareArchitecturesOutput,
  CandidateScore,
  ArchitectureCandidate,
  PolicyResultsMap,
} from '../types/state';

/**
 * Deterministic scoring function for the Coordinator.
 *
 * Computes hard budget/SLA pass-fail and relative scores.
 * NEVER chooses a recommendation. NEVER writes rejection narration.
 * That is the Coordinator's reasoning, on top of these scores.
 *
 * SLA hierarchy:
 *   99.99% > 99.9% > 99.5% > 99%
 */

const SLA_VALUES: Record<string, number> = {
  '99.99%': 4,
  '99.9%': 3,
  '99.5%': 2,
  '99%': 1,
  '95%': 0,
};

const SLA_COMPUTE: Record<string, number> = {
  lambda: 3,       // ~99.9%
  ecs_fargate: 3,  // ~99.9%
  ec2: 2,          // ~99.5% (single AZ)
};

function parseSlaValue(sla: string): number {
  return SLA_VALUES[sla] ?? 2; // default to 99.5%
}

function computeMeetsSla(candidate: ArchitectureCandidate, targetSla: string): boolean {
  const targetValue = parseSlaValue(targetSla);
  const computeValue = SLA_COMPUTE[candidate.compute] ?? 2;
  // Auto-scaling adds one level of availability
  const actualValue = candidate.scaling === 'auto' ? computeValue + 1 : computeValue;
  return actualValue >= targetValue;
}

export function compareArchitectures(
  input: CompareArchitecturesInput
): CompareArchitecturesOutput {
  const { candidates, policyResults, constraints } = input;

  const { monthlyBudget, slaTarget } = constraints;

  // Sort by cost to compute ranks
  const sorted = [...candidates].sort(
    (a, b) => (a.monthlyCost ?? Infinity) - (b.monthlyCost ?? Infinity)
  );
  const costRankMap = new Map<string, number>();
  sorted.forEach((c, i) => costRankMap.set(c.id, i + 1));

  const scores: CandidateScore[] = candidates.map(candidate => {
    const cost = candidate.monthlyCost ?? Infinity;
    const policyChecks = policyResults[candidate.id] ?? [];
    const passCount = policyChecks.filter(c => c.passed).length;
    const policyPassRate = policyChecks.length > 0 ? passCount / policyChecks.length : 1;

    return {
      candidateId: candidate.id,
      withinBudget: cost <= monthlyBudget,
      meetsSla: computeMeetsSla(candidate, slaTarget),
      policyPassRate,
      relativeCostRank: costRankMap.get(candidate.id) ?? 99,
    };
  });

  return { scores };
}
