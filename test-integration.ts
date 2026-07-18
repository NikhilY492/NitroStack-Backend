/**
 * End-to-end integration test.
 * Tests AI Runtime → MCP Backend integration.
 */

import { bootstrapAIRuntime } from "./src/bootstrap";
import { createEmptyState } from "./src/schemas/state.schema";

async function testIntegration() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   AI Runtime + MCP Backend Integration Test             ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    // Bootstrap the complete system
    console.log("[Test] Bootstrapping AI Runtime...");
    const app = bootstrapAIRuntime({ verbose: true });

    console.log(`\n[Test] ${app.stats.totalTools} tools registered`);
    console.log(`[Test]   - MCP tools: ${app.stats.mcpTools}`);
    console.log(`[Test]   - AI tools: ${app.stats.aiTools}`);

    // Create initial state with sample requirements
    const initialState = createEmptyState();
    initialState.requirements = {
      description: "API backend for e-commerce platform",
      expectedUsers: 10000,
      monthlyBudget: 30000,
      slaTarget: "99.9%",
      environment: "prod",
      classification: ["cpu-intensive", "production"],
    };

    console.log("\n[Test] Executing AI Runtime with requirements:");
    console.log(`[Test]   - Description: ${initialState.requirements.description}`);
    console.log(`[Test]   - Users: ${initialState.requirements.expectedUsers}`);
    console.log(`[Test]   - Budget: ₹${initialState.requirements.monthlyBudget}/month`);
    console.log(`[Test]   - SLA: ${initialState.requirements.slaTarget}`);

    // Execute the complete workflow
    console.log("\n[Test] Starting agent execution...\n");
    const finalState = await app.runtime.execute(initialState);

    console.log("\n[Test] ✓ Execution complete!");
    console.log(`[Test] Completed stages: ${finalState.completedStages.join(" → ")}`);
    console.log(`[Test] Session ID: ${finalState.sessionId}`);

    if (finalState.architecture?.candidates) {
      console.log(`\n[Test] Candidates generated: ${finalState.architecture.candidates.length}`);
    }

    if (finalState.pricing) {
      const priceCount = Object.keys(finalState.pricing).length;
      console.log(`[Test] Pricing calculated for: ${priceCount} candidates`);
    }

    if (finalState.terraform) {
      console.log(`[Test] Terraform generated: ${finalState.terraform.length} chars`);
    }

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║   ✓ Integration test PASSED                             ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    return finalState;
  } catch (error) {
    console.error("\n╔══════════════════════════════════════════════════════════╗");
    console.error("║   ✗ Integration test FAILED                             ║");
    console.error("╚══════════════════════════════════════════════════════════╝");
    console.error("\nError:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  testIntegration().catch(console.error);
}

export { testIntegration };
