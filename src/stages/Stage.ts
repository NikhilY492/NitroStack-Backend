/**
 * Generic stage interface.
 * Every logical reasoning stage must implement this interface.
 */

import type { AgentState } from "../../schemas/state";
import type { StageName, StageResult } from "../types";
import type { StageContext } from "../runtime/StageContext";

/**
 * Generic stage interface for the Agent Runtime.
 */
export interface Stage {
  /**
   * The name of this stage.
   */
  readonly name: StageName;

  /**
   * Determines whether this stage can execute given the current state.
   * 
   * @param context - Current execution context
   * @returns True if the stage can execute
   */
  canExecute(context: StageContext): boolean;

  /**
   * Executes this stage.
   * 
   * @param context - Current execution context
   * @returns Stage execution result
   */
  execute(context: StageContext): Promise<StageResult>;

  /**
   * Determines the next stage to execute (if any).
   * 
   * @param state - Current agent state
   * @returns Next stage name, or undefined if workflow complete
   */
  getNextStage(state: AgentState): StageName | undefined;
}
