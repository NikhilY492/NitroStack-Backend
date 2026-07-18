/**
 * LLM provider interface.
 */

import type { LLMResponse, LLMError } from "./LLMResponse";

/**
 * Result of LLM generation.
 */
export type LLMResult = 
  | { success: true; response: LLMResponse }
  | { success: false; error: LLMError };

/**
 * LLM provider interface.
 * All providers must implement this interface.
 */
export interface LLMProvider {
  /**
   * Generate a response from the LLM.
   * 
   * @param prompt - Prompt to send
   * @returns LLM response or error
   */
  generate(prompt: string): Promise<LLMResult>;

  /**
   * Check provider health.
   * 
   * @returns True if provider is healthy
   */
  health(): Promise<boolean>;

  /**
   * Provider name.
   */
  readonly name: string;
}
