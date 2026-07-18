/**
 * Factory for creating and registering MCP tool adapters.
 * Bridges the backend tool implementations to the AI Runtime.
 */

import { MCPToolAdapter } from "./MCPToolAdapter";
import type { MCPRegistry } from "./MCPRegistry";

// Import backend tool implementations
import { readExistingInfrastructure } from "../tools/tfReader";
import { readCompanyPolicies } from "../tools/policyReader";
import { getCloudPricing } from "../tools/pricingLookup";
import { estimateResourceRequirements } from "../tools/resourceEstimator";
import { generateCandidateArchitectures } from "../tools/candidateGenerator";
import { compareArchitectures } from "../tools/architectureComparer";
import { generateTerraform } from "../tools/terraformGenerator";
import { presentAnalysis } from "../tools/analysisPresenter";
import { formatAnalysis } from "../tools/analysisFormatter";
import { submitApproval, checkApprovalStatus } from "../tools/approvalHandler";
import { writeApprovedChanges } from "../tools/tfWriter";

/**
 * Factory for creating MCP tool adapters.
 * Registers all 11 backend tools into the unified registry.
 */
export class MCPToolFactory {
  /**
   * Register all backend MCP tools with the registry.
   * Call this once at application startup.
   */
  static registerAllTools(registry: MCPRegistry): void {
    // 1. read_existing_infrastructure
    registry.registerMCPTool(
      new MCPToolAdapter(
        "read_existing_infrastructure",
        async (input) => readExistingInfrastructure(input as any) as any,
        {
          name: "read_existing_infrastructure",
          description:
            "Reads existing Terraform files from a working directory and returns discovered resources.",
          requiredFields: ["workingDir"],
          categories: ["infrastructure", "read"],
        }
      )
    );

    // 2. read_company_policies
    registry.registerMCPTool(
      new MCPToolAdapter(
        "read_company_policies",
        async (_input) => readCompanyPolicies() as any,
        {
          name: "read_company_policies",
          description:
            "Returns the current company compliance rule set from policy.yaml.",
          requiredFields: [],
          categories: ["policy", "read"],
        }
      )
    );

    // 3. get_cloud_pricing
    registry.registerMCPTool(
      new MCPToolAdapter(
        "get_cloud_pricing",
        async (input) => getCloudPricing(input as any) as any,
        {
          name: "get_cloud_pricing",
          description:
            "Returns the complete monthly INR cost breakdown for an architecture candidate.",
          requiredFields: ["candidate"],
          categories: ["pricing", "read"],
        }
      )
    );

    // 4. estimate_resource_requirements
    registry.registerMCPTool(
      new MCPToolAdapter(
        "estimate_resource_requirements",
        async (input) => estimateResourceRequirements(input as any) as any,
        {
          name: "estimate_resource_requirements",
          description:
            "Turns a workload description and expected user count into rough capacity estimates.",
          requiredFields: ["workloadDescription", "expectedUsers"],
          categories: ["analysis", "estimate"],
        }
      )
    );

    // 5. generate_candidate_architectures (primary name)
    registry.registerMCPTool(
      new MCPToolAdapter(
        "generate_candidate_architectures",
        async (input) => generateCandidateArchitectures(input as any) as any,
        {
          name: "generate_candidate_architectures",
          description:
            "Produces exactly 3 structurally distinct, unpriced architecture candidates.",
          requiredFields: ["requirements", "constraints"],
          categories: ["architecture", "generate"],
        }
      )
    );

    // 5b. generate_architecture_candidates (alias for LLM robustness)
    registry.registerMCPTool(
      new MCPToolAdapter(
        "generate_architecture_candidates",
        async (input) => generateCandidateArchitectures(input as any) as any,
        {
          name: "generate_architecture_candidates",
          description:
            "Produces exactly 3 structurally distinct, unpriced architecture candidates. (Alias)",
          requiredFields: ["requirements", "constraints"],
          categories: ["architecture", "generate"],
        }
      )
    );

    // 6. compare_architectures
    registry.registerMCPTool(
      new MCPToolAdapter(
        "compare_architectures",
        async (input) => compareArchitectures(input as any) as any,
        {
          name: "compare_architectures",
          description:
            "Deterministic scoring aid for evaluating candidate architectures.",
          requiredFields: ["candidates", "policyResults", "constraints"],
          categories: ["architecture", "score"],
        }
      )
    );

    // 7. generate_terraform
    registry.registerMCPTool(
      new MCPToolAdapter(
        "generate_terraform",
        async (input) => generateTerraform(input as any) as any,
        {
          name: "generate_terraform",
          description:
            "Produces HCL Terraform configuration for the recommended candidate.",
          requiredFields: ["candidate"],
          categories: ["terraform", "generate"],
        }
      )
    );

    // 8. present_analysis
    registry.registerMCPTool(
      new MCPToolAdapter(
        "present_analysis",
        async (input) => presentAnalysis(input as any) as any,
        {
          name: "present_analysis",
          description:
            "Packages the completed analysis into an InfrastructureAnalysis payload and renders the dashboard.",
          requiredFields: [
            "sessionId",
            "requirements",
            "recommended",
            "alternatives",
            "reasoning",
            "terraform",
          ],
          categories: ["analysis", "present"],
        }
      )
    );

    // 9. format_analysis
    registry.registerMCPTool(
      new MCPToolAdapter(
        "format_analysis",
        async (input) => formatAnalysis(input as any) as any,
        {
          name: "format_analysis",
          description:
            "Converts the completed analysis into a clean, human-readable Markdown report.",
          requiredFields: [
            "sessionId",
            "requirements",
            "recommended",
            "alternatives",
            "reasoning",
            "terraform",
          ],
          categories: ["analysis", "format"],
        }
      )
    );

    // 10. submit_approval
    registry.registerMCPTool(
      new MCPToolAdapter(
        "submit_approval",
        async (input) => submitApproval(input as any) as any,
        {
          name: "submit_approval",
          description:
            "Records the developer's Approve or Reject decision on an analysis.",
          requiredFields: ["analysisId", "decision"],
          categories: ["approval", "submit"],
        }
      )
    );

    // 11. check_approval_status
    registry.registerMCPTool(
      new MCPToolAdapter(
        "check_approval_status",
        async (input) => checkApprovalStatus(input as any) as any,
        {
          name: "check_approval_status",
          description:
            "Polls for the developer's approval decision on an analysis.",
          requiredFields: ["analysisId"],
          categories: ["approval", "check"],
        }
      )
    );

    // 12. write_approved_changes
    registry.registerMCPTool(
      new MCPToolAdapter(
        "write_approved_changes",
        async (input) => writeApprovedChanges(input as any) as any,
        {
          name: "write_approved_changes",
          description:
            "Writes the approved Terraform HCL to disk in the working directory.",
          requiredFields: ["analysisId"],
          categories: ["terraform", "write"],
        }
      )
    );
  }

  /**
   * Get metadata for all registered tools (for documentation/prompts).
   */
  static getToolMetadata() {
    return [
      {
        name: "read_existing_infrastructure",
        description: "Reads existing Terraform files from a working directory.",
      },
      {
        name: "read_company_policies",
        description: "Returns the current company compliance rules.",
      },
      {
        name: "get_cloud_pricing",
        description: "Returns monthly INR cost breakdown for a candidate.",
      },
      {
        name: "estimate_resource_requirements",
        description: "Estimates capacity requirements from workload description.",
      },
      {
        name: "generate_candidate_architectures",
        description: "Generates 3 unpriced architecture candidates.",
      },
      {
        name: "compare_architectures",
        description: "Scores candidates against budget, SLA, and policies.",
      },
      {
        name: "generate_terraform",
        description: "Generates HCL Terraform for the recommended candidate.",
      },
      {
        name: "present_analysis",
        description: "Renders the architecture dashboard for user review.",
      },
      {
        name: "format_analysis",
        description: "Formats analysis as clean Markdown report.",
      },
      {
        name: "submit_approval",
        description: "Records user Approve/Reject decision.",
      },
      {
        name: "check_approval_status",
        description: "Polls for approval status.",
      },
      {
        name: "write_approved_changes",
        description: "Writes approved Terraform to disk.",
      },
    ];
  }
}
