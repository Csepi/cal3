import { Event } from '../../entities/event.entity';
import { AutomationAction, ActionType } from '../../entities/automation-action.entity';
import { TriggerType } from '../../entities/automation-rule.entity';

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
 * Context for action execution including smart values
 */
export interface ActionExecutionContext {
  event?: Event | null;
  webhookData?: Record<string, any> | null;
  triggerType: TriggerType;
  executedAt?: Date;
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
   * Execute the action with context (supports smart values)
   * @param action The action configuration
   * @param context The execution context (event, webhook data, etc.)
   * @returns Execution result with success/failure and details
   */
  execute(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult>;

  /**
   * Validate action configuration
   * @param actionConfig The configuration to validate
   * @returns True if valid, throws error if invalid
   */
  validateConfig(actionConfig: Record<string, any>): boolean;
}
