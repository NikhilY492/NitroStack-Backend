/**
 * Mock tool implementations for testing.
 * Returns deterministic data without external dependencies.
 */

import { BaseTool, type ToolCapabilities } from "./Tool";

/**
 * Mock pricing tool.
 */
export class MockPricingTool extends BaseTool {
  readonly name = "get_cloud_pricing";
  readonly description = "Get cloud pricing estimates";

  readonly capabilities: ToolCapabilities = {
    async: true,
    maxTimeoutMs: 10000,
    idempotent: true,
    categories: ["pricing"],
    version: "1.0.0",
  };

  async execute(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const compute = (args.compute ?? "ecs") as string;
    const instances = (args.instances ?? 2) as number;

    return {
      provider: "aws",
      compute,
      instances,
      monthlyCost: {
        compute: 1500 * instances,
        storage: 200,
        networking: 100,
        total: 1500 * instances + 300,
      },
      currency: "INR",
      estimatedDate: new Date().toISOString(),
    };
  }

  getRequiredArguments(): readonly string[] {
    return ["compute", "instances"];
  }
}

/**
 * Mock policy reader tool.
 */
export class MockPolicyTool extends BaseTool {
  readonly name = "read_company_policies";
  readonly description = "Read company infrastructure policies";

  readonly capabilities: ToolCapabilities = {
    async: true,
    maxTimeoutMs: 5000,
    idempotent: true,
    categories: ["policy"],
    version: "1.0.0",
  };

  async execute(): Promise<Record<string, unknown>> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      policies: [
        {
          id: "pol-001",
          name: "Must use managed databases",
          description: "All databases must be AWS managed services",
          severity: "critical",
        },
        {
          id: "pol-002",
          name: "Enable encryption",
          description: "All data at rest must be encrypted",
          severity: "critical",
        },
        {
          id: "pol-003",
          name: "Use auto-scaling",
          description: "Compute resources must support auto-scaling",
          severity: "high",
        },
      ],
      version: "2.0.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  getRequiredArguments(): readonly string[] {
    return [];
  }
}

/**
 * Mock architecture catalog tool.
 */
export class MockArchitectureTool extends BaseTool {
  readonly name = "list_architecture_options";
  readonly description = "List available architecture options";

  readonly capabilities: ToolCapabilities = {
    async: true,
    maxTimeoutMs: 10000,
    idempotent: true,
    categories: ["architecture"],
    version: "1.0.0",
  };

  async execute(): Promise<Record<string, unknown>> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      candidates: [
        {
          id: "cand-001",
          name: "ECS on Fargate",
          compute: "ecs_fargate",
          database: "rds_postgres",
          cache: "elasticache_redis",
          pros: ["Managed", "Scalable", "Cost-effective"],
          cons: ["Less flexible"],
        },
        {
          id: "cand-002",
          name: "Lambda with DynamoDB",
          compute: "lambda",
          database: "dynamodb",
          cache: "dynamodb_ttl",
          pros: ["Serverless", "Pay-per-use"],
          cons: ["Cold starts", "Limited CPU"],
        },
        {
          id: "cand-003",
          name: "EC2 with RDS",
          compute: "ec2_instance",
          database: "rds_postgres",
          cache: "elasticache_redis",
          pros: ["Full control", "Flexible"],
          cons: ["More management"],
        },
      ],
      region: "us-east-1",
      provider: "aws",
    };
  }

  getRequiredArguments(): readonly string[] {
    return [];
  }
}

/**
 * Mock Terraform preview tool.
 */
export class MockTerraformTool extends BaseTool {
  readonly name = "preview_terraform";
  readonly description = "Preview Terraform configuration";

  readonly capabilities: ToolCapabilities = {
    async: true,
    maxTimeoutMs: 15000,
    idempotent: false,
    categories: ["terraform"],
    version: "1.0.0",
  };

  async execute(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simulate planning delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const candidateId = (args.candidateId ?? "cand-001") as string;

    return {
      candidateId,
      plan: {
        resources_to_create: [
          "aws_ecs_cluster",
          "aws_ecs_service",
          "aws_rds_instance",
          "aws_elasticache_cluster",
        ],
        estimated_cost_monthly: 1800,
        estimated_deployment_time_minutes: 15,
      },
      validation: {
        passed: true,
        warnings: ["Consider enabling backup retention"],
        errors: [],
      },
      previewUrl: "https://terraform.example.com/preview/tf-123",
    };
  }

  getRequiredArguments(): readonly string[] {
    return ["candidateId"];
  }
}

/**
 * Mock resource estimator tool.
 */
export class MockResourceEstimatorTool extends BaseTool {
  readonly name = "estimate_resources";
  readonly description = "Estimate resource requirements";

  readonly capabilities: ToolCapabilities = {
    async: true,
    maxTimeoutMs: 10000,
    idempotent: true,
    categories: ["analysis"],
    version: "1.0.0",
  };

  async execute(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const rps = (args.rps ?? 100) as number;

    return {
      compute: {
        cpu_cores: Math.ceil(rps / 50),
        memory_gb: Math.ceil(rps / 25),
        recommended_instance: `t4g.${rps < 100 ? "medium" : "large"}`,
      },
      storage: {
        database_size_gb: 100,
        cache_size_gb: 10,
      },
      scaling: {
        min_instances: 2,
        max_instances: Math.ceil(rps / 50) * 3,
        target_cpu_utilization: 70,
      },
    };
  }

  getRequiredArguments(): readonly string[] {
    return ["rps"];
  }
}

/**
 * Creates all mock tools.
 */
export function createMockTools(): BaseTool[] {
  return [
    new MockPricingTool(),
    new MockPolicyTool(),
    new MockArchitectureTool(),
    new MockTerraformTool(),
    new MockResourceEstimatorTool(),
  ];
}
