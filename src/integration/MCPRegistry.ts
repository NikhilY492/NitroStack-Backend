/**
 * Unified registry that manages both AI and MCP tools.
 * Bridges the gap between the two tool systems.
 */

import type { Tool, ToolCapabilities } from "../tools/Tool";
import { ToolRegistry } from "../tools/ToolRegistry";

/**
 * Tracks the origin of a registered tool.
 */
export type ToolOrigin = "ai" | "mcp";

/**
 * Extended tool metadata including origin.
 */
export interface UnifiedToolMetadata {
  name: string;
  description: string;
  capabilities: ToolCapabilities;
  origin: ToolOrigin;
}

/**
 * Unified registry supporting both AI and MCP tools.
 * 
 * Resolution order:
 * 1. AI tools (trusted, tested)
 * 2. MCP tools (adapters)
 * 3. Error
 */
export class MCPRegistry {
  private readonly aiRegistry: ToolRegistry;
  private readonly mcpRegistry: Map<string, Tool> = new Map();
  private readonly origins: Map<string, ToolOrigin> = new Map();

  constructor(aiRegistry?: ToolRegistry) {
    this.aiRegistry = aiRegistry ?? new ToolRegistry();
  }

  /**
   * Register an AI tool.
   */
  public registerAITool(tool: Tool): void {
    this.aiRegistry.register(tool);
    this.origins.set(tool.name, "ai");
  }

  /**
   * Register an MCP tool (already adapted to Tool interface).
   */
  public registerMCPTool(tool: Tool): void {
    if (this.mcpRegistry.has(tool.name)) {
      throw new Error(`MCP Tool "${tool.name}" is already registered`);
    }
    this.mcpRegistry.set(tool.name, tool);
    this.origins.set(tool.name, "mcp");
  }

  /**
   * Get a tool by name (checks AI first, then MCP).
   */
  public get(toolName: string): Tool | undefined {
    // AI registry first
    let tool = this.aiRegistry.get(toolName);
    if (tool) return tool;

    // MCP registry second
    tool = this.mcpRegistry.get(toolName);
    return tool;
  }

  /**
   * Check if a tool is registered (AI or MCP).
   */
  public has(toolName: string): boolean {
    return this.aiRegistry.has(toolName) || this.mcpRegistry.has(toolName);
  }

  /**
   * Get the origin of a tool.
   */
  public getOrigin(toolName: string): ToolOrigin | undefined {
    return this.origins.get(toolName);
  }

  /**
   * Get all tool names (AI + MCP).
   */
  public getToolNames(): string[] {
    const names = new Set<string>();

    for (const name of this.aiRegistry.getToolNames()) {
      names.add(name);
    }

    for (const name of this.mcpRegistry.keys()) {
      names.add(name);
    }

    return Array.from(names);
  }

  /**
   * Get all tools (AI + MCP).
   */
  public getAll(): Tool[] {
    const tools = new Map<string, Tool>();

    for (const tool of this.aiRegistry.getAll()) {
      tools.set(tool.name, tool);
    }

    for (const [name, tool] of this.mcpRegistry) {
      tools.set(name, tool);
    }

    return Array.from(tools.values());
  }

  /**
   * Get tools by category (checks both registries).
   */
  public getByCategory(category: string): Tool[] {
    const tools = new Map<string, Tool>();

    for (const tool of this.aiRegistry.getByCategory(category)) {
      tools.set(tool.name, tool);
    }

    for (const [, tool] of this.mcpRegistry) {
      if (tool.capabilities.categories.includes(category)) {
        tools.set(tool.name, tool);
      }
    }

    return Array.from(tools.values());
  }

  /**
   * Get metadata for all tools.
   */
  public getMetadata(): UnifiedToolMetadata[] {
    const metadata: UnifiedToolMetadata[] = [];

    for (const tool of this.aiRegistry.getAll()) {
      metadata.push({
        name: tool.name,
        description: tool.description,
        capabilities: tool.capabilities,
        origin: "ai",
      });
    }

    for (const [, tool] of this.mcpRegistry) {
      metadata.push({
        name: tool.name,
        description: tool.description,
        capabilities: tool.capabilities,
        origin: "mcp",
      });
    }

    return metadata;
  }

  /**
   * Clear all tools.
   */
  public clear(): void {
    this.aiRegistry.clear();
    this.mcpRegistry.clear();
    this.origins.clear();
  }

  /**
   * Get count of registered tools.
   */
  public size(): number {
    return this.getToolNames().length;
  }

  /**
   * Unregister a tool.
   */
  public unregister(toolName: string): boolean {
    const result =
      this.aiRegistry.unregister(toolName) ||
      this.mcpRegistry.delete(toolName);

    if (result) {
      this.origins.delete(toolName);
    }

    return result;
  }
}
