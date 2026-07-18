/**
 * LLM client for reasoning.
 */

import type { LLMProvider, LLMResult } from "./LLMProvider";
import type { LLMConfig } from "./LLMConfig";
import type { StructuredResponse } from "./LLMResponse";
import { ResponseParser } from "./ResponseParser";

/**
 * LLM client abstraction.
 * Provides a provider-independent interface for LLM interactions.
 */
export class LLMClient {
  constructor(
    private readonly provider: LLMProvider,
    private readonly config: LLMConfig
  ) {}

  /**
   * Generate a response from the LLM.
   * 
   * @param prompt - Prompt to send
   * @returns Raw LLM response
   */
  public async generate(prompt: string): Promise<LLMResult> {
    return this.provider.generate(prompt);
  }

  /**
   * Generate a structured JSON response.
   * 
   * @param prompt - Prompt to send (should request JSON output)
   * @param requiredFields - Required fields in response
   * @returns Parsed structured response
   */
  public async generateStructured<T>(
    prompt: string,
    requiredFields?: readonly string[]
  ): Promise<StructuredResponse<T>> {
    const result = await this.generate(prompt);

    if (!result.success) {
      return {
        success: false,
        data: {} as T,
        errors: [result.error.message],
      };
    }

    const parsed = ResponseParser.parseJSON<T>(result.response.content);

    if (!parsed.success) {
      return parsed;
    }

    // Validate required fields if specified
    if (requiredFields && requiredFields.length > 0) {
      const validationErrors = ResponseParser.validateFields(
        parsed.data,
        requiredFields
      );

      if (validationErrors.length > 0) {
        return {
          success: false,
          data: parsed.data,
          errors: validationErrors,
          raw: parsed.raw,
        };
      }
    }

    return parsed;
  }

  /**
   * Check if LLM is healthy.
   * 
   * @returns True if healthy
   */
  public async health(): Promise<boolean> {
    return this.provider.health();
  }

  /**
   * Get provider name.
   */
  public get providerName(): string {
    return `${this.provider.name} (model: ${this.config.model})`;
  }
}
