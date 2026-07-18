/**
 * Adapts NitroStack MCP tools to the AI Runtime Tool interface.
 * 
 * This is the ONLY file that understands both systems.
 * All other code uses the unified Tool interface.
 */

import type { Tool, ToolCapabilities, ValidationResult } from "../tools/Tool";

/**
 * Wrapped MCP tool function signature.
 * NitroStack tools are async functions that take an input record.
 */
export type MCPToolFunction = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;

/**
 * Metadata about an MCP tool.
 */
export interface MCPToolMetadata {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  requiredFields?: string[];
  categories?: string[];
}

/**
 * Adapts an MCP tool function to the AI Runtime Tool interface.
 * 
 * Usage:
 * ```
 * const adapter = new MCPToolAdapter(
 *   'get_cloud_pricing',
 *   getCloudPricingFunction,
 *   { description: 'Get pricing...', requiredFields: ['candidate'] }
 * );
 * ```
 */
export class MCPToolAdapter implements Tool {
  readonly name: string;
  readonly description: string;
  readonly capabilities: ToolCapabilities;
  private readonly mcpFunction: MCPToolFunction;
  private readonly metadata: MCPToolMetadata;

  constructor(
    name: string,
    mcpFunction: MCPToolFunction,
    metadata: MCPToolMetadata
  ) {
    this.name = name;
    this.mcpFunction = mcpFunction;
    this.metadata = metadata;
    this.description = metadata.description;

    this.capabilities = {
      async: true,
      maxTimeoutMs: 30000,
      idempotent: this.isIdempotent(name),
      categories: metadata.categories ?? ["infrastructure"],
      version: "1.0.0",
    };
  }

  /**
   * Execute the wrapped MCP tool.
   */
  public async execute(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.mcpFunction(args);
  }

  /**
   * Validate input arguments.
   */
  public validate(args: Record<string, unknown>): ValidationResult {
    const required = this.metadata.requiredFields ?? [];
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
   * Get required argument names.
   */
  public getRequiredArguments(): readonly string[] {
    return this.metadata.requiredFields ?? [];
  }

  /**
   * Determine if this tool is idempotent based on its name.
   * Read-only tools (read_, get_, list_) are idempotent.
   * Write tools are not.
   */
  private isIdempotent(toolName: string): boolean {
    const readPrefixes = ["read_", "get_", "list_", "check_"];
    return readPrefixes.some((prefix) => toolName.startsWith(prefix));
  }
}

/**
 * Factory for creating adapters.
 */
export class MCPAdapterFactory {
  /**
   * Create an adapter for a backend MCP tool.
   */
  static createAdapter(
    name: string,
    mcpFunction: MCPToolFunction,
    metadata: MCPToolMetadata
  ): MCPToolAdapter {
    return new MCPToolAdapter(name, mcpFunction, metadata);
  }
}
