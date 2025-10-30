import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
  character_maximum_length: number;
}

interface ConstraintInfo {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

interface IndexInfo {
  table_name: string;
  index_name: string;
  column_name: string;
  is_unique: boolean;
}

async function inspectSchema() {
  console.log('🔍 Starting database schema inspection...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Get database type
    const dbType = dataSource.options.type;
    console.log(`📊 Database Type: ${dbType}\n`);

    // Get all tables
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tables = await dataSource.query(tablesQuery);
    console.log(`📋 Found ${tables.length} tables:\n`);
    console.log(tables.map((t: any) => `  - ${t.table_name}`).join('\n'));
    console.log('\n' + '='.repeat(80) + '\n');

    // Get detailed information for each table
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n📦 TABLE: ${tableName}`);
      console.log('─'.repeat(80));

      // Get columns
      const columnsQuery = `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
      `;

      const columns: ColumnInfo[] = await dataSource.query(columnsQuery, [
        tableName,
      ]);

      console.log('\n  COLUMNS:');
      for (const col of columns) {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length
          ? `(${col.character_maximum_length})`
          : '';
        const defaultVal = col.column_default
          ? ` DEFAULT ${col.column_default}`
          : '';
        console.log(
          `    ${col.column_name.padEnd(30)} ${col.data_type}${length} ${nullable}${defaultVal}`,
        );
      }

      // Get constraints (primary keys, foreign keys, unique)
      const constraintsQuery = `
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
        ORDER BY tc.constraint_type, tc.constraint_name;
      `;

      const constraints: ConstraintInfo[] = await dataSource.query(
        constraintsQuery,
        [tableName],
      );

      if (constraints.length > 0) {
        console.log('\n  CONSTRAINTS:');

        const primaryKeys = constraints.filter(
          (c) => c.constraint_type === 'PRIMARY KEY',
        );
        if (primaryKeys.length > 0) {
          console.log('    PRIMARY KEY:');
          primaryKeys.forEach((pk) => {
            console.log(`      ${pk.column_name}`);
          });
        }

        const foreignKeys = constraints.filter(
          (c) => c.constraint_type === 'FOREIGN KEY',
        );
        if (foreignKeys.length > 0) {
          console.log('    FOREIGN KEYS:');
          foreignKeys.forEach((fk) => {
            console.log(
              `      ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`,
            );
          });
        }

        const uniqueKeys = constraints.filter(
          (c) => c.constraint_type === 'UNIQUE',
        );
        if (uniqueKeys.length > 0) {
          console.log('    UNIQUE:');
          uniqueKeys.forEach((uk) => {
            console.log(`      ${uk.column_name}`);
          });
        }
      }

      // Get indexes
      const indexesQuery = `
        SELECT
          i.relname AS index_name,
          a.attname AS column_name,
          ix.indisunique AS is_unique
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
        AND t.relname = $1
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY i.relname, a.attnum;
      `;

      const indexes: IndexInfo[] = await dataSource.query(indexesQuery, [
        tableName,
      ]);

      if (indexes.length > 0) {
        console.log('\n  INDEXES:');
        const indexGroups: { [key: string]: string[] } = {};
        indexes.forEach((idx) => {
          if (!indexGroups[idx.index_name]) {
            indexGroups[idx.index_name] = [];
          }
          indexGroups[idx.index_name].push(idx.column_name);
        });

        Object.entries(indexGroups).forEach(([name, columns]) => {
          const uniqueMarker = indexes.find((i) => i.index_name === name)
            ?.is_unique
            ? ' [UNIQUE]'
            : '';
          console.log(`    ${name}${uniqueMarker}: (${columns.join(', ')})`);
        });
      }

      console.log('\n');
    }

    console.log('='.repeat(80));
    console.log('\n📊 SUMMARY:');
    console.log(`  Total Tables: ${tables.length}`);

    // Count total columns
    const totalColumnsQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_schema = 'public';
    `;
    const totalColumns = await dataSource.query(totalColumnsQuery);
    console.log(`  Total Columns: ${totalColumns[0].count}`);

    // Count foreign keys
    const fkCountQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND constraint_type = 'FOREIGN KEY';
    `;
    const fkCount = await dataSource.query(fkCountQuery);
    console.log(`  Total Foreign Keys: ${fkCount[0].count}`);

    // Count indexes
    const indexCountQuery = `
      SELECT COUNT(DISTINCT i.relname) as count
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      WHERE t.relkind = 'r'
      AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    `;
    const indexCount = await dataSource.query(indexCountQuery);
    console.log(`  Total Indexes: ${indexCount[0].count}`);

    console.log('\n✅ Schema inspection completed successfully!');
  } catch (error) {
    console.error('❌ Error inspecting schema:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the inspection
if (require.main === module) {
  inspectSchema().catch(console.error);
}

export { inspectSchema };
