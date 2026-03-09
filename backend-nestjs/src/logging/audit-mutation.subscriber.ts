import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { AuditTrailService } from './audit-trail.service';

const EXCLUDED_TABLES = new Set([
  'audit_events',
  'app_logs',
  'app_log_settings',
  'security_audit_log',
]);

@Injectable()
@EventSubscriber()
export class AuditMutationSubscriber implements EntitySubscriberInterface {
  constructor(
    dataSource: DataSource,
    private readonly auditTrailService: AuditTrailService,
  ) {
    dataSource.subscribers.push(this);
  }

  afterInsert(event: InsertEvent<unknown>): void {
    if (!this.shouldTrack(event.metadata.tableName)) return;
    void this.auditTrailService.logDataMutation({
      action: `${event.metadata.tableName}.insert`,
      organisationId: extractOrganisationId(event.entity),
      resourceType: event.metadata.tableName,
      resourceId: extractResourceId(event.entity),
      afterSnapshot: sanitizeEntity(event.entity),
      metadata: {
        operation: 'insert',
      },
    });
  }

  afterUpdate(event: UpdateEvent<unknown>): void {
    if (!this.shouldTrack(event.metadata.tableName)) return;
    void this.auditTrailService.logDataMutation({
      action: `${event.metadata.tableName}.update`,
      organisationId:
        extractOrganisationId(event.entity) ??
        extractOrganisationId(event.databaseEntity),
      resourceType: event.metadata.tableName,
      resourceId:
        extractResourceId(event.entity) ??
        extractResourceId(event.databaseEntity),
      beforeSnapshot: sanitizeEntity(event.databaseEntity),
      afterSnapshot: sanitizeEntity(event.entity),
      metadata: {
        operation: 'update',
        updatedColumns: event.updatedColumns.map((column) => column.propertyName),
      },
    });
  }

  afterRemove(event: RemoveEvent<unknown>): void {
    if (!this.shouldTrack(event.metadata.tableName)) return;
    void this.auditTrailService.logDataMutation({
      action: `${event.metadata.tableName}.delete`,
      organisationId: extractOrganisationId(event.databaseEntity),
      resourceType: event.metadata.tableName,
      resourceId: extractResourceId(event.databaseEntity),
      beforeSnapshot: sanitizeEntity(event.databaseEntity),
      metadata: {
        operation: 'delete',
      },
    });
  }

  private shouldTrack(tableName?: string): boolean {
    if (!tableName) return false;
    return !EXCLUDED_TABLES.has(tableName);
  }
}

const sanitizeEntity = (
  value: unknown,
): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(source)) {
    const lowered = key.toLowerCase();
    if (
      lowered.includes('password') ||
      lowered.includes('token') ||
      lowered.includes('secret')
    ) {
      output[key] = '[REDACTED]';
      continue;
    }
    if (entry instanceof Date) {
      output[key] = entry.toISOString();
      continue;
    }
    if (
      entry &&
      typeof entry === 'object' &&
      !Array.isArray(entry)
    ) {
      output[key] = '[OBJECT]';
      continue;
    }
    output[key] = entry as unknown;
  }
  return output;
};

const extractOrganisationId = (entity: unknown): number | null => {
  if (!entity || typeof entity !== 'object') return null;
  const value =
    (entity as Record<string, unknown>).organisationId ??
    (entity as Record<string, unknown>).organizationId;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const extractResourceId = (entity: unknown): string | null => {
  if (!entity || typeof entity !== 'object') return null;
  const value = (entity as Record<string, unknown>).id;
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return null;
};
