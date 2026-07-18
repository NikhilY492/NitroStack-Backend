/**
 * Routes actions to the appropriate tool.
 */

import type { Action } from "../decision/Action";
import type { Tool } from "./Tool";
import { ToolRegistry } from "./ToolRegistry";

/**
 * Tool routing result.
 */
export interface RoutingResult {
  /** Whether routing succeeded */
  success: boolean;

  /** The resolved tool if successful */
  tool?: Tool;

  /** Error message if failed */
  error?: string;

  /** Validation errors for arguments */
  validationErrors?: string[];
}

/**
 * Maps action names to tool names.
 * Can be customized for specific routing logic.
 */
export type ActionToToolMapper = (actionName: string) => string | null;

/**
 * Default mapper: assumes action name matches tool name.
 */
const defaultMapper: ActionToToolMapper = (actionName: string) => actionName;

/**
 * Routes actions to appropriate tools.
 * Contains no business logic, only tool resolution.
 */
export class ToolRouter {
  private readonly registry: ToolRegistry;
  private readonly mapper: ActionToToolMapper;

  /**
   * Create a tool router.
   *
   * @param registry Tool registry to use for lookups
   * @param mapper Optional custom mapper function
   */
  constructor(registry: ToolRegistry, mapper?: ActionToToolMapper) {
    this.registry = registry;
    this.mapper = mapper ?? defaultMapper;
  }

  /**
   * Route an action to a tool.
   *
   * @param action Action to route
   * @returns Routing result with tool or error
   */
  public route(action: Action): RoutingResult {
    // Map action name to tool name
    const toolName = this.mapper(action.name);

    if (!toolName) {
      return {
        success: false,
        error: `No tool mapping found for action "${action.name}"`,
      };
    }

    // Lookup tool in registry
    const tool = this.registry.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolName}" is not registered`,
      };
    }

    // Validate action arguments
    const validationResult = tool.validate(action.arguments);

    if (!validationResult.valid) {
      return {
        success: false,
        tool,
        error: `Validation failed for tool "${toolName}"`,
        validationErrors: [validationResult.error ?? "Unknown validation error"],
      };
    }

    return {
      success: true,
      tool,
    };
  }

  /**
   * Check if an action can be routed.
   *
   * @param action Action to check
   * @returns True if action can be routed
   */
  public canRoute(action: Action): boolean {
    const result = this.route(action);
    return result.success;
  }

  /**
   * Get all available actions (tool names).
   *
   * @returns Array of action names
   */
  public getAvailableActions(): string[] {
    return this.registry.getToolNames();
  }

  /**
   * Get action metadata (for prompts or documentation).
   */
  public getActionMetadata(): Array<{
    name: string;
    description: string;
    requiredArguments: readonly string[];
  }> {
    return this.registry.getMetadata().map((meta) => ({
      name: meta.name,
      description: meta.description,
      requiredArguments: this.registry
        .get(meta.name)
        ?.getRequiredArguments() ?? [],
    }));
  }
}
