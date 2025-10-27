import { Injectable } from '@nestjs/common';
import { AutomationRule, ConditionLogic } from '../entities/automation-rule.entity';
import {
  AutomationCondition,
  ConditionField,
  ConditionOperator,
} from '../entities/automation-condition.entity';
import { Event } from '../entities/event.entity';
import { ConditionEvaluationDto, ConditionsResultDto } from './dto/automation-audit-log.dto';

@Injectable()
export class AutomationEvaluatorService {
  /**
   * Evaluates all conditions for a rule against an event
   * @param rule The automation rule to evaluate
   * @param event The event to evaluate against (optional for webhook triggers)
   * @param webhookData Optional webhook payload data for webhook.incoming triggers
   * @returns Evaluation result with individual condition results
   */
  async evaluateConditions(
    rule: AutomationRule,
    event: Event | null = null,
    webhookData: Record<string, any> = null,
  ): Promise<ConditionsResultDto> {
    const evaluations: ConditionEvaluationDto[] = [];
    const conditions = rule.conditions || [];

    // Evaluate each condition
    for (const condition of conditions) {
      const evaluation = await this.evaluateCondition(condition, event, webhookData);
      evaluations.push(evaluation);
    }

    // Apply boolean logic
    const passed = this.applyBooleanLogic(
      evaluations,
      rule.conditionLogic || ConditionLogic.AND,
    );

    // Build logic expression for debugging
    const logicExpression = this.buildLogicExpression(evaluations, rule.conditionLogic);

    return {
      passed,
      evaluations,
      logicExpression,
    };
  }

  /**
   * Evaluates a single condition against an event or webhook data
   */
  private async evaluateCondition(
    condition: AutomationCondition,
    event: Event | null,
    webhookData: Record<string, any> = null,
  ): Promise<ConditionEvaluationDto> {
    const evaluation: ConditionEvaluationDto = {
      conditionId: condition.id,
      field: condition.field,
      operator: condition.operator,
      expectedValue: condition.value,
      actualValue: null,
      passed: false,
    };

    try {
      // Extract the actual value from the event or webhook data
      evaluation.actualValue = this.extractFieldValue(condition.field, event, webhookData);

      // Evaluate the condition based on operator
      evaluation.passed = this.evaluateOperator(
        condition.operator,
        evaluation.actualValue,
        condition.value,
      );
    } catch (error) {
      evaluation.error = error.message;
      evaluation.passed = false;
    }

    return evaluation;
  }

  /**
   * Extracts a field value from an event or webhook data using dot notation
   * Supports: event.*, calendar.*, webhook.data.*, and nested fields
   */
  private extractFieldValue(
    field: ConditionField | string,
    event: Event | null,
    webhookData: Record<string, any> = null,
  ): any {
    // Handle webhook.data.* fields
    if (field.startsWith('webhook.data')) {
      if (!webhookData) {
        throw new Error('Webhook data not available for this trigger');
      }

      // Extract the path after 'webhook.data.'
      // Examples: 'webhook.data.customer_id' -> 'customer_id'
      //           'webhook.data.order.status' -> 'order.status'
      const path = field.substring('webhook.data.'.length);

      if (!path) {
        // Return the entire webhook data object if no specific path
        return webhookData;
      }

      // Navigate the path in webhook data
      const parts = path.split('.');
      let value: any = webhookData;

      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          throw new Error(`Webhook data path "${path}" not found in payload`);
        }
      }

      return value;
    }

    // Handle event fields
    if (!event) {
      throw new Error('Event data not available for this condition');
    }

    // Map of supported field paths
    const fieldMap = {
      [ConditionField.EVENT_TITLE]: event.title,
      [ConditionField.EVENT_DESCRIPTION]: event.description || '',
      [ConditionField.EVENT_LOCATION]: event.location || '',
      [ConditionField.EVENT_NOTES]: event.notes || '',
      [ConditionField.EVENT_COLOR]: event.color || '',
      [ConditionField.EVENT_IS_ALL_DAY]: event.isAllDay,
      [ConditionField.EVENT_DURATION]: this.calculateEventDuration(event),
      [ConditionField.EVENT_STATUS]: event.status || '',
      [ConditionField.EVENT_CALENDAR_ID]: event.calendar?.id || null,
      [ConditionField.EVENT_CALENDAR_NAME]: event.calendar?.name || '',
    };

    if (field in fieldMap) {
      return fieldMap[field];
    }

    // If not in map, try to extract using dot notation
    const parts = field.split('.');
    let value: any = event;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        throw new Error(`Field path "${field}" not found in event`);
      }
    }

    return value;
  }

  /**
   * Calculate event duration in minutes
   * @param event The event to calculate duration for
   * @returns Duration in minutes
   */
  private calculateEventDuration(event: Event): number {
    if (event.isAllDay) {
      return 1440; // 24 hours in minutes
    }

    if (!event.startTime || !event.endTime) {
      return 0;
    }

    try {
      const [startHour, startMin] = event.startTime.split(':').map(Number);
      const [endHour, endMin] = event.endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      return endMinutes - startMinutes;
    } catch {
      return 0;
    }
  }

  /**
   * Evaluates a condition operator
   * Supports 15+ operators for strings, numbers, booleans, arrays
   */
  private evaluateOperator(
    operator: ConditionOperator,
    actualValue: any,
    expectedValue: string,
  ): boolean {
    // Normalize values
    const actual = actualValue ?? '';
    const expected = expectedValue ?? '';

    switch (operator) {
      // String operators
      case ConditionOperator.CONTAINS:
        return String(actual).toLowerCase().includes(String(expected).toLowerCase());

      case ConditionOperator.NOT_CONTAINS:
        return !String(actual).toLowerCase().includes(String(expected).toLowerCase());

      case ConditionOperator.EQUALS:
        return String(actual).toLowerCase() === String(expected).toLowerCase();

      case ConditionOperator.NOT_EQUALS:
        return String(actual).toLowerCase() !== String(expected).toLowerCase();

      case ConditionOperator.STARTS_WITH:
        return String(actual).toLowerCase().startsWith(String(expected).toLowerCase());

      case ConditionOperator.ENDS_WITH:
        return String(actual).toLowerCase().endsWith(String(expected).toLowerCase());

      case ConditionOperator.MATCHES:
        try {
          const regex = new RegExp(expected, 'i');
          return regex.test(String(actual));
        } catch {
          return false;
        }

      // Numeric operators
      case ConditionOperator.GREATER_THAN:
        return Number(actual) > Number(expected);

      case ConditionOperator.LESS_THAN:
        return Number(actual) < Number(expected);

      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return Number(actual) >= Number(expected);

      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return Number(actual) <= Number(expected);

      // Boolean operators
      case ConditionOperator.IS_TRUE:
        return Boolean(actual) === true;

      case ConditionOperator.IS_FALSE:
        return Boolean(actual) === false;

      // Empty/Not Empty operators
      case ConditionOperator.IS_EMPTY:
        return actual === '' || actual === null || actual === undefined;

      case ConditionOperator.IS_NOT_EMPTY:
        return actual !== '' && actual !== null && actual !== undefined;

      // Array operators
      case ConditionOperator.IN:
      case ConditionOperator.IN_LIST:
        try {
          const values = expected.split(',').map((v) => v.trim().toLowerCase());
          return values.includes(String(actual).toLowerCase());
        } catch {
          return false;
        }

      case ConditionOperator.NOT_IN:
      case ConditionOperator.NOT_IN_LIST:
        try {
          const values = expected.split(',').map((v) => v.trim().toLowerCase());
          return !values.includes(String(actual).toLowerCase());
        } catch {
          return false;
        }

      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Applies boolean logic to condition evaluations
   * Supports AND, OR, and grouped conditions with nested logic
   */
  private applyBooleanLogic(
    evaluations: ConditionEvaluationDto[],
    logic: ConditionLogic,
  ): boolean {
    if (evaluations.length === 0) {
      return true; // No conditions = always pass
    }

    if (logic === ConditionLogic.AND) {
      // All conditions must pass
      return evaluations.every((e) => e.passed);
    } else {
      // ConditionLogic.OR - At least one condition must pass
      return evaluations.some((e) => e.passed);
    }
  }

  /**
   * Builds a human-readable logic expression for debugging
   * Example: "(condition_1 AND condition_2) OR condition_3"
   */
  private buildLogicExpression(
    evaluations: ConditionEvaluationDto[],
    logic: ConditionLogic,
  ): string {
    if (evaluations.length === 0) {
      return 'true';
    }

    const expressions = evaluations.map((e, i) => {
      const status = e.passed ? '✓' : '✗';
      return `${status} condition_${i + 1}`;
    });

    const operator = logic === ConditionLogic.AND ? ' AND ' : ' OR ';
    return expressions.join(operator);
  }

  /**
   * Advanced: Evaluates grouped conditions with nested boolean logic
   * This supports complex expressions like: (A AND B) OR (C AND D)
   *
   * Note: V1 implementation uses simple AND/OR at rule level.
   * This method is prepared for future enhancement with condition groups.
   */
  private evaluateGroupedConditions(
    evaluations: ConditionEvaluationDto[],
    conditions: AutomationCondition[],
  ): boolean {
    // Group conditions by groupId
    const groups = new Map<string, ConditionEvaluationDto[]>();

    evaluations.forEach((evaluation, index) => {
      const condition = conditions[index];
      const groupId = condition.groupId || 'default';

      if (!groups.has(groupId)) {
        groups.set(groupId, []);
      }
      groups.get(groupId)!.push(evaluation);
    });

    // Evaluate each group with its logic operator
    const groupResults: boolean[] = [];

    for (const [groupId, groupEvaluations] of groups.entries()) {
      if (groupEvaluations.length === 0) continue;

      // Get logic operator from first condition in group
      const firstConditionIndex = evaluations.indexOf(groupEvaluations[0]);
      const logicOperator = conditions[firstConditionIndex]?.logicOperator || 'AND';

      const groupPassed =
        logicOperator === 'AND'
          ? groupEvaluations.every((e) => e.passed)
          : groupEvaluations.some((e) => e.passed);

      groupResults.push(groupPassed);
    }

    // Combine group results (default to OR between groups)
    return groupResults.some((result) => result);
  }
}
