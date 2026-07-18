/**
 * Initializes the AI Runtime with MCP tool integration.
 * This is the bootstrap module that wires everything together.
 * 
 * Call initialize() once at application startup.
 */

import { MCPRegistry } from "./MCPRegistry";
import { MCPToolFactory } from "./MCPToolFactory";
import { BridgeToolRouter } from "./BridgeToolRouter";
import { ToolInvoker } from "../tools/ToolInvoker";
import { ToolExecutor } from "../tools/ToolExecutor";
import { createMockTools } from "../tools/MockToolProvider";

/**
 * Initialized runtime components.
 */
export interface InitializedRuntime {
  /** Unified registry with all tools (AI + MCP) */
  registry: MCPRegistry;

  /** Router for action->tool resolution */
  router: BridgeToolRouter;

  /** Tool invoker with retry logic */
  invoker: ToolInvoker;

  /** Plan executor */
  executor: ToolExecutor;
}

/**
 * Configuration options for runtime initialization.
 */
export interface RuntimeInitOptions {
  /** Whether to register AI mock tools (for testing) */
  includeMockTools?: boolean;

  /** Custom action-to-tool mapper */
  customMapper?: (actionName: string) => string | null;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Initializes the AI Runtime with MCP integration.
 * 
 * This function:
 * 1. Creates a unified MCPRegistry
 * 2. Registers all 11 backend MCP tools
 * 3. Optionally registers AI mock tools
 * 4. Creates BridgeToolRouter
 * 5. Creates ToolInvoker and ToolExecutor
 * 6. Returns ready-to-use runtime components
 * 
 * Usage:
 * ```typescript
 * const runtime = RuntimeInitializer.initialize();
 * // Pass runtime.executor to stages
 * ```
 */
export class RuntimeInitializer {
  /**
   * Initialize the runtime with MCP tool integration.
   */
  static initialize(options: RuntimeInitOptions = {}): InitializedRuntime {
    const {
      includeMockTools = false,
      customMapper,
      verbose = false,
    } = options;

    if (verbose) {
      console.log("[RuntimeInitializer] Initializing AI Runtime with MCP integration...");
    }

    // Step 1: Create unified registry
    const registry = new MCPRegistry();

    // Step 2: Register all MCP backend tools
    if (verbose) {
      console.log("[RuntimeInitializer] Registering 11 MCP backend tools...");
    }
    MCPToolFactory.registerAllTools(registry);

    // Step 3: Optionally register AI mock tools
    if (includeMockTools) {
      if (verbose) {
        console.log("[RuntimeInitializer] Registering AI mock tools...");
      }
      const mockTools = createMockTools();
      for (const tool of mockTools) {
        registry.registerAITool(tool);
      }
    }

    // Step 4: Create router
    const router = new BridgeToolRouter(registry, customMapper);

    // Step 5: Create invoker
    const invoker = new ToolInvoker(router as any); // Type compatible

    // Step 6: Create executor
    const executor = new ToolExecutor(invoker);

    if (verbose) {
      console.log(
        `[RuntimeInitializer] Initialization complete. ${registry.size()} tools registered.`
      );
      console.log(
        `[RuntimeInitializer] Available tools: ${registry.getToolNames().join(", ")}`
      );
    }

    return {
      registry,
      router,
      invoker,
      executor,
    };
  }

  /**
   * Get tool metadata for all registered tools.
   * Useful for LLM prompt generation.
   */
  static getToolMetadata(runtime: InitializedRuntime): Array<{
    name: string;
    description: string;
    requiredArguments: readonly string[];
    origin: "ai" | "mcp";
  }> {
    return runtime.router.getActionMetadata();
  }

  /**
   * Check if a specific tool is available.
   */
  static hasT(runtime: InitializedRuntime, toolName: string): boolean {
    return runtime.registry.has(toolName);
  }

  /**
   * Get statistics about registered tools.
   */
  static getStats(runtime: InitializedRuntime): {
    totalTools: number;
    aiTools: number;
    mcpTools: number;
    toolNames: string[];
  } {
    const allTools = runtime.registry.getAll();
    const aiTools = allTools.filter(
      (t) => runtime.registry.getOrigin(t.name) === "ai"
    );
    const mcpTools = allTools.filter(
      (t) => runtime.registry.getOrigin(t.name) === "mcp"
    );

    return {
      totalTools: allTools.length,
      aiTools: aiTools.length,
      mcpTools: mcpTools.length,
      toolNames: runtime.registry.getToolNames(),
    };
  }
}
