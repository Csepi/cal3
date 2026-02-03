import { Injectable } from '@nestjs/common';
import { TriggerType } from '../entities/automation-rule.entity';
import { Event } from '../entities/event.entity';

export interface SmartValueContext {
  event?: Event | null;
  webhookData?: Record<string, unknown> | null;
  triggerType: TriggerType;
  executedAt?: Date;
}

@Injectable()
export class AutomationSmartValuesService {
  /**
   * Extract all available smart values from the trigger context
   * Returns a flat object with all accessible values
   */
  extractSmartValues(context: SmartValueContext): Record<string, unknown> {
    const values: Record<string, unknown> = {};

    // Add timestamp values (available for all triggers)
    const now = context.executedAt || new Date();
    values['trigger.timestamp'] = now.toISOString();
    values['trigger.date'] = now.toISOString().split('T')[0];
    values['trigger.time'] = now.toTimeString().split(' ')[0];
    values['trigger.type'] = context.triggerType;

    // Add event-related smart values
    if (context.event) {
      const event = context.event;

      // Basic event fields
      values['event.id'] = event.id;
      values['event.title'] = event.title;
      values['event.description'] = event.description || '';
      values['event.location'] = event.location || '';
      values['event.notes'] = event.notes || '';
      values['event.startTime'] = event.startTime || '';
      values['event.endTime'] = event.endTime || '';
      values['event.color'] = event.color || '';
      values['event.isAllDay'] = event.isAllDay ? 'true' : 'false';
      values['event.status'] = event.status || '';

      // Calendar fields (if available)
      if (event.calendar) {
        values['calendar.id'] = event.calendar.id;
        values['calendar.name'] = event.calendar.name;
        values['calendar.color'] = event.calendar.color || '';
        values['calendar.description'] = event.calendar.description || '';
      }

      // Computed values
      if (event.startTime && event.endTime && !event.isAllDay) {
        const duration = this.calculateDuration(event.startTime, event.endTime);
        values['event.duration'] = duration.toString();
        values['event.durationHours'] = Math.floor(duration / 60).toString();
        values['event.durationMinutes'] = (duration % 60).toString();
      }

      // Date components
      const eventDateValue = event.startDate ? new Date(event.startDate) : null;
      if (eventDateValue && !isNaN(eventDateValue.valueOf())) {
        values['event.date'] = eventDateValue.toISOString().split('T')[0];
        values['event.year'] = eventDateValue.getFullYear().toString();
        values['event.month'] = (eventDateValue.getMonth() + 1)
          .toString()
          .padStart(2, '0');
        values['event.day'] = eventDateValue
          .getDate()
          .toString()
          .padStart(2, '0');
        values['event.dayOfWeek'] = eventDateValue.toLocaleDateString('en-US', {
          weekday: 'long',
        });
        values['event.dayOfWeekShort'] = eventDateValue.toLocaleDateString(
          'en-US',
          { weekday: 'short' },
        );
      } else {
        values['event.date'] = '';
      }
    }

    // Add webhook data smart values
    if (context.webhookData) {
      this.flattenObject(context.webhookData, 'webhook.data', values);
    }

    return values;
  }

  /**
   * Replace smart value placeholders in a string
   * Supports syntax: {{field.path}} or ${field.path}
   */
  interpolateSmartValues(text: string, context: SmartValueContext): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    const smartValues = this.extractSmartValues(context);

    // Replace {{field.path}} syntax
    let result = text.replace(
      /\{\{([^}]+)\}\}/g,
      (match: string, path: string) => {
        const value = this.getNestedValue(smartValues, path.trim());
        return value !== undefined ? String(value) : match;
      },
    );

    // Replace ${field.path} syntax
    result = result.replace(/\$\{([^}]+)\}/g, (match: string, path: string) => {
      const value = this.getNestedValue(smartValues, path.trim());
      return value !== undefined ? String(value) : match;
    });

    return result;
  }

  /**
   * Interpolate smart values in an object (recursively)
   * Used for action configurations
   */
  interpolateObjectValues(
    obj: Record<string, unknown>,
    context: SmartValueContext,
  ): Record<string, unknown> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateSmartValues(value, context);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'string'
            ? this.interpolateSmartValues(item, context)
            : typeof item === 'object'
              ? this.interpolateObjectValues(
                  item as Record<string, unknown>,
                  context,
                )
              : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.interpolateObjectValues(
          value as Record<string, unknown>,
          context,
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get available smart value fields for a given trigger type
   * Used for UI to show available fields
   */
  getAvailableSmartValues(triggerType: TriggerType): Array<{
    field: string;
    label: string;
    description: string;
    category: string;
  }> {
    const fields: Array<{
      field: string;
      label: string;
      description: string;
      category: string;
    }> = [];

    // Trigger fields (always available)
    fields.push(
      {
        field: 'trigger.timestamp',
        label: 'Trigger Timestamp',
        description: 'ISO timestamp when rule was triggered',
        category: 'Trigger',
      },
      {
        field: 'trigger.date',
        label: 'Trigger Date',
        description: 'Date when rule was triggered (YYYY-MM-DD)',
        category: 'Trigger',
      },
      {
        field: 'trigger.time',
        label: 'Trigger Time',
        description: 'Time when rule was triggered (HH:MM:SS)',
        category: 'Trigger',
      },
      {
        field: 'trigger.type',
        label: 'Trigger Type',
        description: 'Type of trigger that fired the rule',
        category: 'Trigger',
      },
    );

    // Event fields (for event-based triggers)
    if (this.isEventBasedTrigger(triggerType)) {
      fields.push(
        // Basic fields
        {
          field: 'event.id',
          label: 'Event ID',
          description: 'Unique event identifier',
          category: 'Event',
        },
        {
          field: 'event.title',
          label: 'Event Title',
          description: 'Event title/name',
          category: 'Event',
        },
        {
          field: 'event.description',
          label: 'Event Description',
          description: 'Event description text',
          category: 'Event',
        },
        {
          field: 'event.location',
          label: 'Event Location',
          description: 'Event location',
          category: 'Event',
        },
        {
          field: 'event.notes',
          label: 'Event Notes',
          description: 'Event notes/additional info',
          category: 'Event',
        },
        {
          field: 'event.date',
          label: 'Event Date',
          description: 'Event date (YYYY-MM-DD)',
          category: 'Event',
        },
        {
          field: 'event.startTime',
          label: 'Event Start Time',
          description: 'Event start time (HH:MM)',
          category: 'Event',
        },
        {
          field: 'event.endTime',
          label: 'Event End Time',
          description: 'Event end time (HH:MM)',
          category: 'Event',
        },
        {
          field: 'event.color',
          label: 'Event Color',
          description: 'Event color code',
          category: 'Event',
        },
        {
          field: 'event.status',
          label: 'Event Status',
          description: 'Event status',
          category: 'Event',
        },
        {
          field: 'event.isAllDay',
          label: 'Is All Day',
          description: 'Whether event is all-day (true/false)',
          category: 'Event',
        },

        // Computed fields
        {
          field: 'event.duration',
          label: 'Duration (minutes)',
          description: 'Event duration in minutes',
          category: 'Event',
        },
        {
          field: 'event.durationHours',
          label: 'Duration (hours)',
          description: 'Event duration in hours',
          category: 'Event',
        },
        {
          field: 'event.durationMinutes',
          label: 'Duration (remaining minutes)',
          description: 'Remaining minutes after hours',
          category: 'Event',
        },

        // Date components
        {
          field: 'event.year',
          label: 'Year',
          description: 'Event year (YYYY)',
          category: 'Event Date',
        },
        {
          field: 'event.month',
          label: 'Month',
          description: 'Event month (MM)',
          category: 'Event Date',
        },
        {
          field: 'event.day',
          label: 'Day',
          description: 'Event day (DD)',
          category: 'Event Date',
        },
        {
          field: 'event.dayOfWeek',
          label: 'Day of Week',
          description: 'Event day name (Monday, Tuesday, etc.)',
          category: 'Event Date',
        },
        {
          field: 'event.dayOfWeekShort',
          label: 'Day of Week (short)',
          description: 'Event day abbreviation (Mon, Tue, etc.)',
          category: 'Event Date',
        },

        // Calendar fields
        {
          field: 'calendar.id',
          label: 'Calendar ID',
          description: 'Calendar identifier',
          category: 'Calendar',
        },
        {
          field: 'calendar.name',
          label: 'Calendar Name',
          description: 'Calendar name',
          category: 'Calendar',
        },
        {
          field: 'calendar.color',
          label: 'Calendar Color',
          description: 'Calendar color code',
          category: 'Calendar',
        },
        {
          field: 'calendar.description',
          label: 'Calendar Description',
          description: 'Calendar description',
          category: 'Calendar',
        },
      );
    }

    // Webhook fields
    if (triggerType === TriggerType.WEBHOOK_INCOMING) {
      fields.push({
        field: 'webhook.data.*',
        label: 'Webhook Data (arbitrary field)',
        description:
          'Access arbitrary fields from webhook JSON using dot notation',
        category: 'Webhook',
      });
    }

    return fields;
  }

  /**
   * Flatten nested object for smart value extraction
   */
  private flattenObject(
    obj: Record<string, unknown>,
    prefix: string,
    result: Record<string, unknown>,
    maxDepth: number = 10,
    currentDepth: number = 0,
  ): void {
    if (currentDepth >= maxDepth) {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = `${prefix}.${key}`;

      if (value === null || value === undefined) {
        result[fullKey] = '';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        this.flattenObject(
          value as Record<string, unknown>,
          fullKey,
          result,
          maxDepth,
          currentDepth + 1,
        );
      } else if (Array.isArray(value)) {
        // Store array as JSON string
        result[fullKey] = JSON.stringify(value);
        // Also store individual items if array of primitives
        value.forEach((item, index) => {
          if (typeof item !== 'object') {
            result[`${fullKey}[${index}]`] = String(item);
          }
        });
      } else {
        result[fullKey] = String(value);
      }
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): any {
    // Direct lookup first (most common case)
    if (path in obj) {
      return obj[path];
    }

    // Try nested path lookup
    const parts = path.split('.');
    let value: any = obj;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Calculate duration in minutes from start and end time
   */
  private calculateDuration(startTime: string, endTime: string): number {
    try {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      return Math.max(0, endMinutes - startMinutes);
    } catch {
      return 0;
    }
  }

  /**
   * Check if trigger type involves events
   */
  private isEventBasedTrigger(triggerType: TriggerType): boolean {
    return [
      TriggerType.EVENT_CREATED,
      TriggerType.EVENT_UPDATED,
      TriggerType.EVENT_DELETED,
      TriggerType.EVENT_STARTS_IN,
      TriggerType.EVENT_ENDS_IN,
      TriggerType.CALENDAR_IMPORTED,
    ].includes(triggerType);
  }
}
