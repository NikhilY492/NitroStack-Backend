import { v4 as uuidv4 } from 'uuid';
import { InfrastructureAnalysis } from '../types/state';
import { pendingAnalyses } from '../store/pendingAnalyses';

/**
 * Assigns server-side fields (id, timestamp, status: "pending") to the analysis,
 * writes it to the in-memory store, and returns the full payload.
 *
 * This is the tool the @Widget('arch-dashboard') decorator is attached to.
 * Its return value becomes the widget's props.
 */
export function presentAnalysis(
  input: Omit<InfrastructureAnalysis, 'id' | 'timestamp' | 'status'>
): InfrastructureAnalysis {
  // Validate minimum required shape
  if (!input.requirements || !input.recommended || !input.terraform) {
    throw new Error(
      'INVALID_PAYLOAD_SHAPE: present_analysis requires requirements, recommended, and terraform fields'
    );
  }

  const analysis: InfrastructureAnalysis = {
    ...input,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    status: 'pending',
  };

  pendingAnalyses.set(analysis.id, analysis);

  return analysis;
}
