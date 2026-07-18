/**
 * Example usage of the Agent Runtime (Phase 2).
 * 
 * This demonstrates the runtime executing all stages in order
 * without any actual reasoning or external tool calls.
 */

import { AgentRuntime } from "./src/runtime";
import { createEmptyState } from "./schemas/state.schema";

async function main() {
  // Create runtime with verbose logging
  const runtime = new AgentRuntime({ verbose: true });

  // Create initial state
  const initialState = createEmptyState();

  console.log("Starting agent runtime example...\n");

  // Execute the workflow
  const finalState = await runtime.execute(initialState);

  console.log("\nExecution complete!");
  console.log("Completed stages:", finalState.completedStages);
}

main().catch(console.error);
