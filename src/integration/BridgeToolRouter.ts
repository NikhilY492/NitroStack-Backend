/**
 * Extended Tool Router that supports both AI and MCP tools.
 * Uses the unified MCPRegistry to resolve actions to tools.
 */

import type { Action } from "../decision/Action";
import type { Tool } from "../tools/Tool";
import type { MCPRegistry } from "./MCPRegistry";

/**
 * Tool routing result with origin information.
 */
export interface BridgeRoutingResult {
  /** Whether routing succeeded */
  success: boolean;

  /** The resolved tool if successful */
  tool?: Tool;

  /** Which system the tool came from */
  origin?: "ai" | "mcp";

  /** Error message if failed */
  error?: string;

  /** Validation errors for arguments */
  validationErrors?: string[];
}

/**
 * Custom action-to-tool mapper function.
 * Allows application-specific routing logic.
 */
export type ActionToToolMapper = (actionName: string) => string | null;

/**
 * Default mapper: action name maps directly to tool name.
 */
const defaultMapper: ActionToToolMapper = (actionName: string) => actionName;

/**
 * Routes actions to tools using the unified MCPRegistry.
 * Supports both AI and MCP tools transparently.
 */
export class BridgeToolRouter {
  private readonly registry: MCPRegistry;
  private readonly mapper: ActionToToolMapper;

  /**
   * Create a bridge router.
   * 
   * @param registry Unified MCPRegistry with both AI and MCP tools
   * @param mapper Optional custom action-to-tool mapper
   */
  constructor(registry: MCPRegistry, mapper?: ActionToToolMapper) {
    this.registry = registry;
    this.mapper = mapper ?? defaultMapper;
  }

  /**
   * Route an action to a tool (AI or MCP).
   * Caller doesn't need to know which system the tool came from.
   */
  public route(action: Action): BridgeRoutingResult {
    // Map action name to tool name
    const toolName = this.mapper(action.name);

    if (!toolName) {
      return {
        success: false,
        error: `No tool mapping found for action "${action.name}"`,
      };
    }

    // Lookup tool in unified registry (tries AI first, then MCP)
    const tool = this.registry.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolName}" is not registered (tried both AI and MCP registries)`,
      };
    }

    // Validate action arguments
    const validationResult = tool.validate(action.arguments);

    if (!validationResult.valid) {
      return {
        success: false,
        tool,
        origin: this.registry.getOrigin(toolName),
        error: `Validation failed for tool "${toolName}"`,
        validationErrors: [validationResult.error ?? "Unknown validation error"],
      };
    }

    return {
      success: true,
      tool,
      origin: this.registry.getOrigin(toolName),
    };
  }

  /**
   * Check if an action can be routed.
   */
  public canRoute(action: Action): boolean {
    const result = this.route(action);
    return result.success;
  }

  /**
   * Get all available actions (both AI and MCP tool names).
   */
  public getAvailableActions(): string[] {
    return this.registry.getToolNames();
  }

  /**
   * Get action metadata for all tools (for prompts, documentation, etc.).
   */
  public getActionMetadata(): Array<{
    name: string;
    description: string;
    requiredArguments: readonly string[];
    origin: "ai" | "mcp";
  }> {
    return this.registry.getMetadata().map((meta) => ({
      name: meta.name,
      description: meta.description,
      requiredArguments: this.registry
        .get(meta.name)
        ?.getRequiredArguments() ?? [],
      origin: meta.origin,
    }));
  }

  /**
   * Get only AI tools (for fallback if needed).
   */
  public getAITools(): Tool[] {
    return this.registry
      .getAll()
      .filter((tool) => this.registry.getOrigin(tool.name) === "ai");
  }

  /**
   * Get only MCP tools.
   */
  public getMCPTools(): Tool[] {
    return this.registry
      .getAll()
      .filter((tool) => this.registry.getOrigin(tool.name) === "mcp");
  }
}
