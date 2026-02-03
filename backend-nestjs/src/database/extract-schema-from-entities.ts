import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Calendar, CalendarShare } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import {
  CalendarSyncConnection,
  SyncedCalendar,
  SyncEventMapping,
} from '../entities/calendar-sync.entity';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { OrganisationUser } from '../entities/organisation-user.entity';
import { OrganisationResourceTypePermission } from '../entities/organisation-resource-type-permission.entity';
import { OrganisationCalendarPermission } from '../entities/organisation-calendar-permission.entity';
import { ReservationCalendar } from '../entities/reservation-calendar.entity';
import { ReservationCalendarRole } from '../entities/reservation-calendar-role.entity';
import { ResourceType } from '../entities/resource-type.entity';
import { Resource } from '../entities/resource.entity';
import { OperatingHours } from '../entities/operating-hours.entity';
import { Reservation } from '../entities/reservation.entity';
import { AutomationRule } from '../entities/automation-rule.entity';
import { AutomationCondition } from '../entities/automation-condition.entity';
import { AutomationAction } from '../entities/automation-action.entity';
import { AutomationAuditLog } from '../entities/automation-audit-log.entity';

async function extractSchemaFromEntities() {
  console.log('🔍 Extracting schema information from TypeORM entities...\n');

  // Create a temporary SQLite data source to extract metadata
  const tempDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [
      User,
      Calendar,
      CalendarShare,
      Event,
      CalendarSyncConnection,
      SyncedCalendar,
      SyncEventMapping,
      Organisation,
      OrganisationAdmin,
      OrganisationUser,
      OrganisationResourceTypePermission,
      OrganisationCalendarPermission,
      ReservationCalendar,
      ReservationCalendarRole,
      ResourceType,
      Resource,
      OperatingHours,
      Reservation,
      AutomationRule,
      AutomationCondition,
      AutomationAction,
      AutomationAuditLog,
    ],
    synchronize: false,
  });

  await tempDataSource.initialize();

  const entities = tempDataSource.entityMetadatas;

  console.log(`📊 Found ${entities.length} entities\n`);
  console.log('='.repeat(100) + '\n');

  const schemaReport: Record<string, unknown> = {
    totalTables: entities.length,
    tables: [],
  };

  for (const entity of entities) {
    const tableName = entity.tableName;
    const entityName = entity.name;

    console.log(`\n📦 TABLE: ${tableName} (Entity: ${entityName})`);
    console.log('─'.repeat(100));

    const tableInfo: Record<string, unknown> = {
      tableName,
      entityName,
      columns: [],
      relations: [],
      indexes: [],
      uniques: [],
    };

    // Columns
    console.log('\n  COLUMNS:');
    for (const column of entity.columns) {
      const columnInfo: Record<string, unknown> = {
        name: column.propertyName,
        databaseName: column.databaseName,
        type: column.type,
        length: column.length,
        nullable: column.isNullable,
        default: column.default,
        isPrimary: column.isPrimary,
        isGenerated: column.isGenerated,
        generationStrategy: column.generationStrategy,
      };

      tableInfo.columns.push(columnInfo);

      const typeStr = column.length
        ? `${column.type}(${column.length})`
        : String(column.type);
      const nullable = column.isNullable ? 'NULL' : 'NOT NULL';
      const defaultVal = column.default ? ` DEFAULT ${column.default}` : '';
      const primaryKey = column.isPrimary ? ' PRIMARY KEY' : '';
      const generated = column.isGenerated ? ` AUTO_INCREMENT` : '';

      console.log(
        `    ${column.databaseName.padEnd(35)} ${typeStr.padEnd(20)} ${nullable}${defaultVal}${primaryKey}${generated}`,
      );
    }

    // Relations
    if (entity.relations.length > 0) {
      console.log('\n  RELATIONS:');
      for (const relation of entity.relations) {
        const relationType = relation.relationType;
        const targetEntity = relation.inverseEntityMetadata.name;
        const joinColumns = relation.joinColumns
          .map((jc) => jc.databaseName)
          .join(', ');
        const inverseSide = relation.inverseSidePropertyPath || 'N/A';

        const relationInfo: Record<string, unknown> = {
          propertyName: relation.propertyName,
          type: relationType,
          targetEntity,
          joinColumns,
          inverseSide,
          cascadeOptions:
            relation.isCascadeInsert ||
            relation.isCascadeUpdate ||
            relation.isCascadeRemove,
        };

        tableInfo.relations.push(relationInfo);

        console.log(
          `    ${relation.propertyName.padEnd(30)} ${relationType.padEnd(20)} → ${targetEntity}`,
        );
        if (joinColumns) {
          console.log(`      ${''.padEnd(28)} Join Column: ${joinColumns}`);
        }
        if (relation.onDelete) {
          console.log(`      ${''.padEnd(28)} On Delete: ${relation.onDelete}`);
        }
        if (relation.isCascadeRemove) {
          console.log(`      ${''.padEnd(28)} Cascade: DELETE`);
        }
      }
    }

    // Foreign Keys
    if (entity.foreignKeys.length > 0) {
      console.log('\n  FOREIGN KEYS:');
      for (const fk of entity.foreignKeys) {
        const columns = fk.columnNames.join(', ');
        const refTable = fk.referencedTablePath;
        const refColumns = fk.referencedColumnNames.join(', ');
        const onDelete = fk.onDelete || 'NO ACTION';
        const onUpdate = fk.onUpdate || 'NO ACTION';

        console.log(`    ${columns} → ${refTable}(${refColumns})`);
        console.log(`      On Delete: ${onDelete}, On Update: ${onUpdate}`);
      }
    }

    // Indexes
    if (entity.indices.length > 0) {
      console.log('\n  INDEXES:');
      for (const index of entity.indices) {
        const columns = index.columns.map((c) => c.databaseName).join(', ');
        const unique = index.isUnique ? ' [UNIQUE]' : '';
        console.log(`    ${index.name}${unique}: (${columns})`);

        tableInfo.indexes.push({
          name: index.name,
          columns: index.columns.map((c) => c.databaseName),
          isUnique: index.isUnique,
        });
      }
    }

    // Unique constraints
    if (entity.uniques.length > 0) {
      console.log('\n  UNIQUE CONSTRAINTS:');
      for (const unique of entity.uniques) {
        const columns = unique.columns.map((c) => c.databaseName).join(', ');
        console.log(`    ${unique.name || 'UNNAMED'}: (${columns})`);

        tableInfo.uniques.push({
          name: unique.name,
          columns: unique.columns.map((c) => c.databaseName),
        });
      }
    }

    schemaReport.tables.push(tableInfo);
    console.log('\n');
  }

  console.log('='.repeat(100));
  console.log('\n📊 SCHEMA SUMMARY:');
  console.log(`  Total Tables: ${schemaReport.totalTables}`);

  let totalColumns = 0;
  let totalRelations = 0;
  let totalIndexes = 0;
  let totalForeignKeys = 0;

  for (const table of schemaReport.tables) {
    totalColumns += table.columns.length;
    totalRelations += table.relations.length;
    totalIndexes += table.indexes.length;
  }

  totalForeignKeys = entities.reduce((sum, e) => sum + e.foreignKeys.length, 0);

  console.log(`  Total Columns: ${totalColumns}`);
  console.log(`  Total Relations: ${totalRelations}`);
  console.log(`  Total Foreign Keys: ${totalForeignKeys}`);
  console.log(`  Total Indexes: ${totalIndexes}`);

  console.log('\n📋 TABLE LIST:');
  for (const table of schemaReport.tables) {
    console.log(
      `  - ${table.tableName.padEnd(40)} (${table.columns.length} columns, ${table.relations.length} relations)`,
    );
  }

  console.log('\n✅ Schema extraction completed successfully!\n');

  await tempDataSource.destroy();

  return schemaReport;
}

// Run the extraction
if (require.main === module) {
  extractSchemaFromEntities().catch(console.error);
}

export { extractSchemaFromEntities };
