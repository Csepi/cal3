import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Event } from '../../entities/event.entity';
import { AutomationAction, ActionType } from '../../entities/automation-action.entity';
import { IActionExecutor, ActionExecutionResult, ActionExecutionContext } from './action-executor.interface';
import { ActionExecutorRegistry } from './action-executor-registry';
import { AutomationSmartValuesService } from '../automation-smart-values.service';

/**
 * Executor for WEBHOOK action
 * Sends HTTP POST request to a configured webhook URL
 * Can optionally include event data in the payload
 */
@Injectable()
export class WebhookExecutor implements IActionExecutor, OnModuleInit {
  readonly actionType = ActionType.WEBHOOK;
  private readonly logger = new Logger(WebhookExecutor.name);

  constructor(
    private readonly registry: ActionExecutorRegistry,
    private readonly smartValuesService: AutomationSmartValuesService,
  ) {}

  onModuleInit() {
    // Self-register with the registry
    this.registry.register(this);
  }

  /**
   * Execute the webhook action with smart values support
   * @param action The action configuration with webhook URL and options
   * @param context The execution context (includes event and webhook data)
   * @returns Execution result
   */
  async execute(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    const executedAt = new Date();

    try {
      // Interpolate smart values in action configuration
      const interpolatedConfig = this.smartValuesService.interpolateObjectValues(
        action.actionConfig,
        context,
      );

      // Validate configuration (after interpolation)
      this.validateConfig(interpolatedConfig);

      const { url, includeEventData, headers, customPayload } = interpolatedConfig;

      // Prepare payload (support custom payload with smart values)
      let payload: Record<string, any>;
      if (customPayload) {
        // Use custom payload if provided (already interpolated)
        payload = typeof customPayload === 'string' ? JSON.parse(customPayload) : customPayload;
      } else if (includeEventData && context.event) {
        // Build event payload
        payload = this.buildEventPayload(context.event);
      } else {
        // Default minimal payload
        payload = { timestamp: executedAt.toISOString() };
      }

      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'PrimeCal-Automation/1.0',
        ...((headers || {}) as Record<string, string>),
      };

      // Send webhook request
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload),
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook returned ${response.status} ${response.statusText}`,
        );
      }

      const responseText = await response.text();
      let responseBody: any;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }

      this.logger.log(
        `Webhook sent successfully to ${url} (${response.status})`,
      );

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          url,
          includedEventData: includeEventData,
          statusCode: response.status,
          responseBody,
        },
        executedAt,
      };
    } catch (error) {
      this.logger.error(
        `Webhook execution failed: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        actionId: action.id,
        actionType: this.actionType,
        error: error.message || 'Webhook request failed',
        executedAt,
      };
    }
  }

  /**
   * Validate action configuration
   * @param actionConfig Must contain a valid URL
   * @returns True if valid
   * @throws Error if invalid
   */
  validateConfig(actionConfig: Record<string, any>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (!actionConfig.url) {
      throw new Error('Action configuration must include a "url" property');
    }

    const url = actionConfig.url;

    if (typeof url !== 'string') {
      throw new Error('URL must be a string');
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('URL must use HTTP or HTTPS protocol');
      }
    } catch (error) {
      throw new Error(`Invalid URL format: ${error.message}`);
    }

    // Validate includeEventData if present
    if (
      actionConfig.includeEventData !== undefined &&
      typeof actionConfig.includeEventData !== 'boolean'
    ) {
      throw new Error('includeEventData must be a boolean');
    }

    // Validate headers if present
    if (actionConfig.headers !== undefined) {
      if (
        typeof actionConfig.headers !== 'object' ||
        Array.isArray(actionConfig.headers)
      ) {
        throw new Error('headers must be an object');
      }
    }

    return true;
  }

  /**
   * Build event data payload for webhook
   * @param event The event to extract data from
   * @returns Payload object with event details
   */
  private buildEventPayload(event: Event): Record<string, any> {
    return {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        isAllDay: event.isAllDay,
        color: event.color,
        location: event.location,
        calendarId: event.calendarId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
