/**
 * Response parser for LLM outputs.
 */

import type { StructuredResponse } from "./LLMResponse";

/**
 * Parses and validates LLM responses.
 */
export class ResponseParser {
  /**
   * Parse JSON response from LLM.
   * 
   * @param rawResponse - Raw string response
   * @returns Parsed structured response
   */
  public static parseJSON<T>(rawResponse: string): StructuredResponse<T> {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonContent = this.extractJSON(rawResponse);
      
      if (!jsonContent) {
        return {
          success: false,
          data: {} as T,
          errors: ["No JSON content found in response"],
          raw: rawResponse,
        };
      }

      const parsed = JSON.parse(jsonContent) as T;

      return {
        success: true,
        data: parsed,
        raw: rawResponse,
      };
    } catch (error) {
      return {
        success: false,
        data: {} as T,
        errors: [
          `JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
        raw: rawResponse,
      };
    }
  }

  /**
   * Extract JSON from response text.
   * Handles markdown code blocks and plain JSON.
   */
  private static extractJSON(text: string): string | null {
    // Try to find JSON in markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try to find JSON object directly
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return null;
  }

  /**
   * Validate that required fields exist in parsed data.
   * 
   * @param data - Parsed data
   * @param requiredFields - Required field names
   * @returns Validation errors (empty if valid)
   */
  public static validateFields(
    data: unknown,
    requiredFields: readonly string[]
  ): readonly string[] {
    if (!data || typeof data !== "object") {
      return ["Response is not an object"];
    }

    const errors: string[] = [];
    const obj = data as Record<string, unknown>;

    for (const field of requiredFields) {
      if (!(field in obj) || obj[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return errors;
  }
}
