import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ActionType } from '../../entities/automation-action.entity';
import { IActionExecutor } from './action-executor.interface';

/**
 * Registry for all action executors
 * Implements the plugin architecture pattern
 */
@Injectable()
export class ActionExecutorRegistry implements OnModuleInit {
  private executors = new Map<ActionType, IActionExecutor>();

  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    // Executors will self-register when they're instantiated by NestJS
  }

  /**
   * Register an action executor
   * @param executor The executor to register
   */
  register(executor: IActionExecutor): void {
    if (this.executors.has(executor.actionType)) {
      throw new Error(
        `Executor for action type "${executor.actionType}" is already registered`,
      );
    }

    this.executors.set(executor.actionType, executor);
    console.log(
      `[ActionExecutorRegistry] Registered executor for: ${executor.actionType}`,
    );
  }

  /**
   * Get an executor by action type
   * @param actionType The action type
   * @returns The executor for this action type
   * @throws Error if no executor is registered for this action type
   */
  getExecutor(actionType: ActionType): IActionExecutor {
    const executor = this.executors.get(actionType);

    if (!executor) {
      throw new Error(`No executor registered for action type: ${actionType}`);
    }

    return executor;
  }

  /**
   * Check if an executor exists for an action type
   * @param actionType The action type to check
   * @returns True if executor exists
   */
  hasExecutor(actionType: ActionType): boolean {
    return this.executors.has(actionType);
  }

  /**
   * Get all registered action types
   * @returns Array of registered action types
   */
  getRegisteredActionTypes(): ActionType[] {
    return Array.from(this.executors.keys());
  }

  /**
   * Get count of registered executors
   * @returns Number of registered executors
   */
  getExecutorCount(): number {
    return this.executors.size;
  }
}
