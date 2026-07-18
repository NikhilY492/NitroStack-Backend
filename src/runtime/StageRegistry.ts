/**
 * Stage registry for managing stage instances.
 */

import type { StageName } from "../types";
import type { Stage } from "../stages/Stage";

/**
 * Registry for managing stage instances.
 * Stages are registered once and retrieved by name.
 */
export class StageRegistry {
  private readonly stages: Map<StageName, Stage>;

  constructor() {
    this.stages = new Map();
  }

  /**
   * Registers a stage.
   * 
   * @param stage - Stage to register
   * @throws Error if stage name already registered
   */
  public register(stage: Stage): void {
    if (this.stages.has(stage.name)) {
      throw new Error(`Stage '${stage.name}' is already registered`);
    }
    this.stages.set(stage.name, stage);
  }

  /**
   * Retrieves a stage by name.
   * 
   * @param name - Stage name
   * @returns Stage instance
   * @throws Error if stage not found
   */
  public get(name: StageName): Stage {
    const stage = this.stages.get(name);
    if (!stage) {
      throw new Error(`Stage '${name}' not found in registry`);
    }
    return stage;
  }

  /**
   * Checks if a stage is registered.
   * 
   * @param name - Stage name
   * @returns True if registered
   */
  public has(name: StageName): boolean {
    return this.stages.has(name);
  }

  /**
   * Gets all registered stage names.
   * 
   * @returns Array of registered stage names
   */
  public getRegisteredStages(): StageName[] {
    return Array.from(this.stages.keys());
  }

  /**
   * Clears all registered stages.
   */
  public clear(): void {
    this.stages.clear();
  }
}
