import { Event } from '../../entities/event.entity';
import { AutomationAction, ActionType } from '../../entities/automation-action.entity';

/**
 * Result of action execution
 */
export interface ActionExecutionResult {
  success: boolean;
  actionId: number;
  actionType: ActionType;
  error?: string;
  data?: Record<string, any>;
  executedAt: Date;
}

/**
 * Interface for all action executors
 * Each action type must implement this interface
 */
export interface IActionExecutor {
  /**
   * The action type this executor handles
   */
  readonly actionType: ActionType;

  /**
   * Execute the action on an event
   * @param action The action configuration
   * @param event The event to execute the action on
   * @returns Execution result with success/failure and details
   */
  execute(action: AutomationAction, event: Event): Promise<ActionExecutionResult>;

  /**
   * Validate action configuration
   * @param actionConfig The configuration to validate
   * @returns True if valid, throws error if invalid
   */
  validateConfig(actionConfig: Record<string, any>): boolean;
}
