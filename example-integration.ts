/**
 * Example: AI Runtime with MCP Integration
 * 
 * Demonstrates how the AI Runtime connects to backend MCP tools
 * through the bridge layer.
 */

import { RuntimeInitializer } from "./src/integration";
import { AgentRuntime } from "./src/runtime/AgentRuntime";
import { createEmptyState } from "./src/schemas/state.schema";
import { ActionPlanner, createAction } from "./src/decision";
import { createToolContext, NoOpLogger, NoOpMetrics } from "./src/tools";

/**
 * Example 1: Initialize runtime with MCP tools
 */
async function exampleInitialization() {
  console.log("=== Example 1: Runtime Initialization ===\n");

  // Initialize the runtime
  const runtime = RuntimeInitializer.initialize({
    includeMockTools: false, // Use only real MCP tools
    verbose: true,
  });

  // Get stats
  const stats = RuntimeInitializer.getStats(runtime);
  console.log("\nRuntime Stats:");
  console.log(`  Total tools: ${stats.totalTools}`);
  console.log(`  MCP tools: ${stats.mcpTools}`);
  console.log(`  AI tools: ${stats.aiTools}`);
  console.log(`  Available: ${stats.toolNames.join(", ")}\n`);

  return runtime;
}

/**
 * Example 2: Execute a single tool action
 */
async function exampleSingleToolExecution() {
  console.log("=== Example 2: Single Tool Execution ===\n");

  const runtime = RuntimeInitializer.initialize({ verbose: false });
  const state = createEmptyState();

  // Create an action to read policies
  const action = createAction({
    id: "action-1",
    name: "read_company_policies",
    purpose: "Load company compliance policies",
    arguments: {},
  });

  // Create tool context
  const context = createToolContext(action, state, {
    logger: new NoOpLogger(),
    metrics: new NoOpMetrics(),
  });

  console.log("Executing action:", action.name);

  // Invoke the tool
  const result = await runtime.invoker.invoke(action, context);

  console.log("Success:", result.success);
  console.log("Execution time:", result.executionTimeMs, "ms");
  if (result.success && result.data) {
    console.log("Policies loaded:", Object.keys(result.data).length > 0);
  }
  console.log();
}

/**
 * Example 3: Execute an execution plan with multiple actions
 */
async function exampleExecutionPlan() {
  console.log("=== Example 3: Execution Plan ===\n");

  const runtime = RuntimeInitializer.initialize({ verbose: false });
  const state = createEmptyState();

  // Create a plan with multiple actions
  const actions = [
    createAction({
      id: "action-1",
      name: "read_company_policies",
      purpose: "Load policies",
      arguments: {},
    }),
    createAction({
      id: "action-2",
      name: "read_existing_infrastructure",
      purpose: "Check existing resources",
      arguments: { workingDir: "./sample-project" },
      dependencies: [], // Can run in parallel with action-1
    }),
  ];

  // Create an execution plan
  const llmOutput = {
    reasoning: "Load policies and existing infrastructure",
    actions,
  };

  const planResult = ActionPlanner.plan(llmOutput, "plan-1");

  if (!planResult.success || !planResult.plan) {
    console.error("Planning failed:", planResult.errors);
    return;
  }

  console.log("Plan created with", planResult.actionCount, "actions");

  // Execute the plan
  const executionResult = await runtime.executor.execute(
    planResult.plan,
    (action, _plannedAction) =>
      createToolContext(action, state, {
        logger: new NoOpLogger(),
        metrics: new NoOpMetrics(),
      })
  );

  console.log("Execution complete:");
  console.log("  Success:", executionResult.success);
  console.log("  Completed:", executionResult.completedCount);
  console.log("  Failed:", executionResult.failedCount);
  console.log("  Total time:", executionResult.totalTimeMs, "ms");
  console.log();
}

/**
 * Example 4: Full AI Runtime orchestration
 */
async function exampleFullOrchestration() {
  console.log("=== Example 4: Full AI Runtime Orchestration ===\n");

  // Initialize runtime components
  const runtime = RuntimeInitializer.initialize({
    verbose: true,
  });

  // Create initial state
  const initialState = createEmptyState();

  // Create agent runtime
  const agentRuntime = new AgentRuntime();

  console.log("\nStarting agent execution...");
  console.log("Note: Stages will execute with placeholder logic until");
  console.log("they are updated to use LLM + tool execution.\n");

  try {
    // Execute the agent workflow
    const finalState = await agentRuntime.execute(initialState);

    console.log("\nAgent execution complete!");
    console.log("Completed stages:", finalState.completedStages.join(" → "));
    console.log("Session ID:", finalState.sessionId);
  } catch (error) {
    console.error("\nAgent execution failed:", error);
  }

  console.log();
}

/**
 * Example 5: Check tool availability
 */
function exampleToolAvailability() {
  console.log("=== Example 5: Tool Availability ===\n");

  const runtime = RuntimeInitializer.initialize({ verbose: false });

  const toolsToCheck = [
    "read_company_policies",
    "get_cloud_pricing",
    "generate_candidate_architectures",
    "compare_architectures",
    "generate_terraform",
    "some_nonexistent_tool",
  ];

  console.log("Checking tool availability:\n");

  for (const toolName of toolsToCheck) {
    const available = RuntimeInitializer.hasT(runtime, toolName);
    const origin = runtime.registry.getOrigin(toolName);
    console.log(`  ${toolName}: ${available ? `✓ (${origin})` : "✗ Not found"}`);
  }

  console.log();
}

/**
 * Run all examples
 */
async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   AI Runtime + MCP Integration Examples                 ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    await exampleInitialization();
    await exampleSingleToolExecution();
    await exampleExecutionPlan();
    exampleToolAvailability();
    await exampleFullOrchestration();

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║   All examples completed successfully!                  ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
  } catch (error) {
    console.error("\n❌ Error running examples:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runIntegrationExamples };
