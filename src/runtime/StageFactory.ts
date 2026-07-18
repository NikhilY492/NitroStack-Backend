/**
 * Factory for creating stage instances.
 */

import type { StageName } from "../types";
import type { Stage } from "../stages/Stage";
import { PlannerStage } from "../stages/PlannerStage";
import { RequirementsStage } from "../stages/RequirementsStage";
import { ArchitectureStage } from "../stages/ArchitectureStage";
import { CostStage } from "../stages/CostStage";
import { PolicyStage } from "../stages/PolicyStage";
import { CoordinatorStage } from "../stages/CoordinatorStage";

/**
 * Factory for creating stage instances.
 * Centralizes stage construction logic.
 */
export class StageFactory {
  /**
   * Creates a stage instance by name.
   * 
   * @param name - Stage name
   * @returns Stage instance
   * @throws Error if stage name is unknown
   */
  public static create(name: StageName): Stage {
    switch (name) {
      case "planner":
        return new PlannerStage();
      case "requirements":
        return new RequirementsStage();
      case "architect":
        return new ArchitectureStage();
      case "cost":
        return new CostStage();
      case "policy":
        return new PolicyStage();
      case "coordinator":
        return new CoordinatorStage();
      default:
        throw new Error(`Unknown stage name: ${name}`);
    }
  }

  /**
   * Creates all stages and returns them as an array.
   * 
   * @returns Array of all stage instances
   */
  public static createAll(): Stage[] {
    const stageNames: StageName[] = [
      "planner",
      "requirements",
      "architect",
      "cost",
      "policy",
      "coordinator",
    ];

    return stageNames.map((name) => this.create(name));
  }
}
