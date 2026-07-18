/**
 * LLM response types.
 */

/**
 * Raw response from LLM provider.
 */
export interface LLMResponse {
  /**
   * Response content.
   */
  readonly content: string;

  /**
   * Provider-specific metadata.
   */
  readonly metadata?: {
    readonly model?: string;
    readonly tokensUsed?: number;
    readonly finishReason?: string;
  };
}

/**
 * Parsed structured response.
 */
export interface StructuredResponse<T> {
  /**
   * Parsed data matching the expected type.
   */
  readonly data: T;

  /**
   * Whether parsing was successful.
   */
  readonly success: boolean;

  /**
   * Parsing errors (if any).
   */
  readonly errors?: readonly string[];

  /**
   * Raw response (for debugging).
   */
  readonly raw?: string;
}

/**
 * LLM error types.
 */
export type LLMErrorType =
  | "provider_error"
  | "timeout"
  | "invalid_response"
  | "rate_limit"
  | "authentication"
  | "unknown";

/**
 * LLM error.
 */
export interface LLMError {
  readonly type: LLMErrorType;
  readonly message: string;
  readonly retryable: boolean;
  readonly details?: unknown;
}
