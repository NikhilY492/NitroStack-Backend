/**
 * Tool interface - every tool must implement this contract.
 */

/**
 * Metadata about a tool's capabilities.
 */
export interface ToolCapabilities {
  /** Whether tool supports async execution */
  async: boolean;

  /** Maximum execution time in milliseconds */
  maxTimeoutMs: number;

  /** Whether tool is idempotent */
  idempotent: boolean;

  /** Categories this tool belongs to */
  categories: string[];

  /** Version of the tool */
  version: string;
}

/**
 * Tool validation result.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Error message if invalid */
  error?: string;

  /** Missing required fields */
  missingFields?: string[];
}

/**
 * Generic tool interface.
 * All tools must implement this contract.
 */
export interface Tool {
  /** Unique tool identifier */
  readonly name: string;

  /** Human-readable description */
  readonly description: string;

  /** Tool capabilities metadata */
  readonly capabilities: ToolCapabilities;

  /**
   * Execute the tool with given arguments.
   *
   * @param args Tool-specific arguments
   * @returns Result data
   * @throws Error if execution fails
   */
  execute(args: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Validate arguments before execution.
   *
   * @param args Arguments to validate
   * @returns Validation result
   */
  validate(args: Record<string, unknown>): ValidationResult;

  /**
   * Get required argument names for this tool.
   *
   * @returns Array of required argument names
   */
  getRequiredArguments(): readonly string[];
}

/**
 * Base class for tools using dependency injection.
 */
export abstract class BaseTool implements Tool {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly capabilities: ToolCapabilities;

  /**
   * Execute the tool.
   */
  abstract execute(args: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Validate arguments.
   * Override in subclasses for custom validation.
   */
  public validate(args: Record<string, unknown>): ValidationResult {
    const required = this.getRequiredArguments();
    const missingFields = required.filter((field) => !(field in args));

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required arguments: ${missingFields.join(", ")}`,
        missingFields,
      };
    }

    return { valid: true };
  }

  /**
   * Get required arguments.
   * Override in subclasses to specify requirements.
   */
  public getRequiredArguments(): readonly string[] {
    return [];
  }
}
