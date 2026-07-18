/**
 * Coordinator stage implementation.
 */

import type { StageName } from "../types";
import type { StageContext } from "../runtime/StageContext";
import type { AgentState } from "../schemas/state";
import { BaseStage } from "./BaseStage";
import { createAction } from "../decision/Action";
import { createToolContext, NoOpLogger, NoOpMetrics } from "../tools/ToolContext";

/**
 * Coordinator stage - chooses recommendation and generates final output.
 * 
 * This stage:
 * 1. Invokes compare_architectures to score candidates
 * 2. Chooses best candidate
 * 3. Invokes generate_terraform for the winner
 * 4. Invokes format_analysis to create final report
 */
export class CoordinatorStage extends BaseStage {
  public readonly name: StageName = "coordinator";

  protected async executeInternal(context: StageContext): Promise<unknown> {
    const state = context.state;

    // Check if we have tool executor
    if (!this.toolDeps?.toolExecutor) {
      this.log("No tool executor available, using placeholder", context);
      return this.placeholderOutput();
    }

    try {
      // Phase 1: Compare architectures
      const compareAction = createAction({
        id: "compare-architectures",
        name: "compare_architectures",
        purpose: "Score all candidates",
        arguments: {
          candidates: state.architecture?.candidates ?? [],
          policyResults: state.policyResults ?? {},
          constraints: {
            monthlyBudget: state.requirements?.monthlyBudget ?? 50000,
            slaTarget: state.requirements?.slaTarget ?? "99.9%",
          },
        },
      });

      const compareContext = createToolContext(compareAction, state, {
        logger: new NoOpLogger(),
        metrics: new NoOpMetrics(),
      });

      this.log("Comparing architectures...", context);
      const compareResult = await this.toolDeps.toolExecutor.executeAction(
        compareAction,
        compareContext
      );

      if (!compareResult.success) {
        throw new Error(`compare_architectures failed: ${compareResult.error}`);
      }

      const scores = compareResult.data?.scores ?? [];
      const bestScore = scores.sort(
        (a: any, b: any) => b.policyPassRate - a.policyPassRate
      )[0];
      const recommendedCandidateId = bestScore?.candidateId ?? "cand-a";

      this.log(`Selected candidate: ${recommendedCandidateId}`, context);

      // Phase 2: Generate Terraform
      const recommended = state.architecture?.candidates?.find(
        (c: any) => c.id === recommendedCandidateId
      );

      if (!recommended) {
        throw new Error(`Recommended candidate ${recommendedCandidateId} not found`);
      }

      const tfAction = createAction({
        id: "generate-terraform",
        name: "generate_terraform",
        purpose: "Generate HCL for recommended candidate",
        arguments: { candidate: recommended },
      });

      const tfContext = createToolContext(tfAction, state, {
        logger: new NoOpLogger(),
        metrics: new NoOpMetrics(),
      });

      this.log("Generating Terraform...", context);
      const tfResult = await this.toolDeps.toolExecutor.executeAction(
        tfAction,
        tfContext
      );

      if (!tfResult.success) {
        throw new Error(`generate_terraform failed: ${tfResult.error}`);
      }

      const terraform = tfResult.data;

      // Phase 3: Format analysis (final output)
      const formatAction = createAction({
        id: "format-analysis",
        name: "format_analysis",
        purpose: "Create final Markdown report",
        arguments: {
          sessionId: state.sessionId,
          requirements: state.requirements,
          recommended: {
            candidate: recommended,
            pricing: state.pricing?.[recommendedCandidateId] ?? {},
            policyResults: state.policyResults?.[recommendedCandidateId] ?? [],
            scores: bestScore,
          },
          alternatives: state.architecture?.candidates
            ?.filter((c: any) => c.id !== recommendedCandidateId)
            .map((c: any) => ({
              candidate: c,
              rejectionReason: "Lower policy pass rate or higher cost",
              pricing: state.pricing?.[c.id],
              policyResults: state.policyResults?.[c.id],
            })) ?? [],
          reasoning: {
            summary: `Selected ${recommended.label} based on policy compliance and cost`,
            bullets: [
              `Policy pass rate: ${(bestScore?.policyPassRate * 100).toFixed(0)}%`,
              `Within budget: ${bestScore?.withinBudget ? "Yes" : "No"}`,
              `Meets SLA: ${bestScore?.meetsSla ? "Yes" : "No"}`,
            ],
            confidence: 0.85,
          },
          terraform,
        },
      });

      const formatContext = createToolContext(formatAction, state, {
        logger: new NoOpLogger(),
        metrics: new NoOpMetrics(),
      });

      this.log("Formatting analysis...", context);
      const formatResult = await this.toolDeps.toolExecutor.executeAction(
        formatAction,
        formatContext
      );

      if (!formatResult.success) {
        throw new Error(`format_analysis failed: ${formatResult.error}`);
      }

      // Return coordinator output
      return {
        recommendedCandidateId,
        summary: [
          `Selected ${recommended.label}`,
          `Policy compliance: ${(bestScore?.policyPassRate * 100).toFixed(0)}%`,
          `Cost ranking: #${bestScore?.relativeCostRank}`,
        ],
        confidence: 0.85,
        terraform: terraform?.hcl ?? "",
        markdown: formatResult.data?.markdown ?? "",
        scores,
      };
    } catch (error) {
      this.log(`Error: ${error}`, context);
      return this.placeholderOutput();
    }
  }

  private placeholderOutput() {
    return {
      recommendedCandidateId: "placeholder",
      summary: ["Placeholder coordinator decision"],
      confidence: 0.8,
      tradeoffAnalysis: {
        cost: "Placeholder",
        performance: "Placeholder",
        reliability: "Placeholder",
        scalability: "Placeholder",
        policyCompliance: "Placeholder",
        operationalComplexity: "Placeholder",
      },
      rejections: [],
    };
  }

  public getNextStage(_state: AgentState): StageName | undefined {
    // Workflow complete
    return undefined;
  }
}
