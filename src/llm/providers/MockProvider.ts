/**
 * Mock LLM provider for testing.
 */

import type { LLMProvider, LLMResult } from "../LLMProvider";

/**
 * Mock provider that returns placeholder JSON responses.
 * Useful for testing without calling real LLM APIs.
 */
export class MockProvider implements LLMProvider {
  public readonly name = "mock";

  public async generate(_prompt: string): Promise<LLMResult> {
    // Return mock JSON response
    const mockResponse = {
      canProceed: true,
      nextAction: "extract_requirements",
      observations: ["Mock planner execution"],
      isResumedSession: false,
    };

    return {
      success: true,
      response: {
        content: JSON.stringify(mockResponse, null, 2),
        metadata: {
          model: "mock",
          tokensUsed: 0,
        },
      },
    };
  }

  public async health(): Promise<boolean> {
    return true;
  }
}
