/**
 * Base prompt builder.
 */

import type { AgentState } from "../schemas/state";

/**
 * Base interface for prompt builders.
 */
export interface PromptBuilder<TConfig = unknown> {
  /**
   * Build a complete prompt for the LLM.
   * 
   * @param state - Current agent state
   * @param config - Stage-specific configuration
   * @returns Complete prompt string
   */
  build(state: AgentState, config?: TConfig): string;
}

/**
 * Helper to format JSON for inclusion in prompts.
 */
export function formatJSON(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Helper to format array as bullet list.
 */
export function formatList(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}
