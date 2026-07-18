/**
 * Bootstrap module for AI Runtime + MCP Integration.
 * 
 * This module is called ONCE at application startup.
 * It wires the AI Runtime to the MCP backend through the bridge layer.
 */

import { RuntimeInitializer } from "./integration";
import { AgentRuntime } from "./runtime/AgentRuntime";
import { StageFactory } from "./runtime/StageFactory";
import type { ToolExecutor } from "./tools/ToolExecutor";

/**
 * Bootstrapped application with AI Runtime ready to execute.
 */
export interface BootstrappedApp {
  /** Agent runtime ready for execution */
  runtime: AgentRuntime;

  /** Tool executor (for stages that need it) */
  executor: ToolExecutor;

  /** Registration statistics */
  stats: {
    totalTools: number;
    mcpTools: number;
    aiTools: number;
  };
}

/**
 * Bootstrap options.
 */
export interface BootstrapOptions {
  /** Enable verbose logging */
  verbose?: boolean;

  /** Include AI mock tools for testing */
  includeMockTools?: boolean;
}

/**
 * Bootstrap the complete AI Runtime with MCP integration.
 * 
 * Call this ONCE at startup:
 * ```typescript
 * const app = bootstrapAIRuntime({ verbose: true });
 * const finalState = await app.runtime.execute(initialState);
 * ```
 */
export function bootstrapAIRuntime(
  options: BootstrapOptions = {}
): BootstrappedApp {
  const { verbose = false, includeMockTools = false } = options;

  if (verbose) {
    console.log("[Bootstrap] Initializing AI Runtime with MCP backend...");
  }

  // Step 1: Initialize runtime components (registry, router, invoker, executor)
  const runtimeComponents = RuntimeInitializer.initialize({
    verbose,
    includeMockTools,
  });

  // Step 2: Wire executor into stages
  const stages = StageFactory.createAll();
  for (const stage of stages) {
    // Inject tool dependencies into each stage
    if ("setToolDependencies" in stage && typeof stage.setToolDependencies === "function") {
      stage.setToolDependencies({
        toolExecutor: runtimeComponents.executor,
      });
    }
  }

  if (verbose) {
    console.log("[Bootstrap] Tool dependencies injected into all stages");
  }

  // Step 3: Create AgentRuntime
  const agentRuntime = new AgentRuntime();

  // Step 4: Get stats
  const stats = RuntimeInitializer.getStats(runtimeComponents);

  if (verbose) {
    console.log(`[Bootstrap] Complete. ${stats.totalTools} tools available.`);
  }

  return {
    runtime: agentRuntime,
    executor: runtimeComponents.executor,
    stats: {
      totalTools: stats.totalTools,
      mcpTools: stats.mcpTools,
      aiTools: stats.aiTools,
    },
  };
}
