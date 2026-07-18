/**
 * LLM configuration.
 */

/**
 * LLM provider type.
 */
export type LLMProviderType = "anthropic" | "openai" | "mock";

/**
 * LLM configuration.
 */
export interface LLMConfig {
  /**
   * Provider to use.
   */
  readonly provider: LLMProviderType;

  /**
   * Model name/identifier.
   */
  readonly model: string;

  /**
   * API key (from environment).
   */
  readonly apiKey?: string;

  /**
   * Maximum tokens in response.
   */
  readonly maxTokens: number;

  /**
   * Temperature (0-1).
   */
  readonly temperature: number;

  /**
   * Request timeout (ms).
   */
  readonly timeoutMs: number;

  /**
   * Maximum retry attempts.
   */
  readonly maxRetries: number;

  /**
   * Provider-specific options.
   */
  readonly providerOptions?: Record<string, unknown>;
}

/**
 * Default LLM configuration.
 */
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 4096,
  temperature: 0.7,
  timeoutMs: 30000,
  maxRetries: 2,
};
