/**
 * Registry for tools.
 * Single source of truth for available tools.
 */

import type { Tool, ToolCapabilities } from "./Tool";

/**
 * Tool metadata stored in registry.
 */
export interface RegisteredTool {
  tool: Tool;
  registeredAt: Date;
}

/**
 * Registry for tools.
 * Supports registration, lookup, and metadata queries.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();

  /**
   * Register a new tool.
   *
   * @param tool Tool to register
   * @throws Error if tool with same name already registered
   */
  public register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }

    this.tools.set(tool.name, {
      tool,
      registeredAt: new Date(),
    });
  }

  /**
   * Unregister a tool.
   *
   * @param toolName Name of tool to unregister
   * @returns True if tool was registered and removed
   */
  public unregister(toolName: string): boolean {
    return this.tools.delete(toolName);
  }

  /**
   * Get a tool by name.
   *
   * @param toolName Name of tool
   * @returns Tool or undefined if not found
   */
  public get(toolName: string): Tool | undefined {
    return this.tools.get(toolName)?.tool;
  }

  /**
   * Check if a tool is registered.
   *
   * @param toolName Name of tool
   * @returns True if tool exists
   */
  public has(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get all registered tool names.
   *
   * @returns Array of tool names
   */
  public getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all registered tools.
   *
   * @returns Array of tools
   */
  public getAll(): Tool[] {
    return Array.from(this.tools.values()).map((rt) => rt.tool);
  }

  /**
   * Get tools by category.
   *
   * @param category Category name
   * @returns Tools in that category
   */
  public getByCategory(category: string): Tool[] {
    return this.getAll().filter((tool) =>
      tool.capabilities.categories.includes(category)
    );
  }

  /**
   * Get tool metadata (name, description, capabilities).
   *
   * @returns Array of tool metadata
   */
  public getMetadata(): Array<{
    name: string;
    description: string;
    capabilities: ToolCapabilities;
  }> {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      capabilities: tool.capabilities,
    }));
  }

  /**
   * Clear all registered tools.
   * Useful for testing.
   */
  public clear(): void {
    this.tools.clear();
  }

  /**
   * Get count of registered tools.
   */
  public size(): number {
    return this.tools.size;
  }
}
