import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

// Read all entity files
const entitiesDir = path.join(__dirname, '..', 'entities');
const entityFiles = fs
  .readdirSync(entitiesDir)
  .filter((f) => f.endsWith('.entity.ts'));

console.log('🔍 Analyzing TypeORM Entity Files...\n');
console.log(`📂 Found ${entityFiles.length} entity files in ${entitiesDir}\n`);
console.log('='.repeat(100) + '\n');

const schemaInfo: any = {
  totalEntities: entityFiles.length,
  tables: [],
};

for (const file of entityFiles) {
  const filePath = path.join(entitiesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  console.log(`\n📄 File: ${file}`);
  console.log('─'.repeat(100));

  // Extract entity decorator
  const entityMatch = content.match(/@Entity\('([^']+)'\)/);
  if (!entityMatch) {
    console.log('  ⚠️  No @Entity decorator found');
    continue;
  }

  const tableName = entityMatch[1];
  console.log(`\n  📦 TABLE: ${tableName}`);

  const tableInfo: any = {
    file,
    tableName,
    columns: [],
    relations: [],
    enums: [],
  };

  // Extract enums
  const enumRegex = /export enum (\w+) \{([^}]+)\}/g;
  let enumMatch;
  while ((enumMatch = enumRegex.exec(content)) !== null) {
    const enumName = enumMatch[1];
    const enumBody = enumMatch[2];
    const enumValues = enumBody
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v)
      .map((v) => {
        const [key, value] = v.split('=').map((s) => s.trim());
        return { key, value: value?.replace(/'/g, '') };
      });

    tableInfo.enums.push({ name: enumName, values: enumValues });
    console.log(`\n  📌 ENUM: ${enumName}`);
    enumValues.forEach((ev) => console.log(`      ${ev.key} = ${ev.value}`));
  }

  // Extract columns
  console.log('\n  COLUMNS:');
  const columnRegex = /@Column\(([^)]*)\)[\s\n]+(\w+):\s*([^;]+);/g;
  let colMatch;
  while ((colMatch = columnRegex.exec(content)) !== null) {
    const config = colMatch[1];
    const name = colMatch[2];
    const type = colMatch[3].trim();

    let nullable = 'NOT NULL';
    let defaultValue = '';
    let length = '';
    let unique = '';

    if (config.includes('nullable: true')) nullable = 'NULL';
    if (config.includes('unique: true')) unique = ' UNIQUE';

    const defaultMatch = config.match(/default:\s*([^,}]+)/);
    if (defaultMatch) defaultValue = ` DEFAULT ${defaultMatch[1].trim()}`;

    const lengthMatch = config.match(/length:\s*(\d+)/);
    if (lengthMatch) length = `(${lengthMatch[1]})`;

    tableInfo.columns.push({
      name,
      type,
      nullable,
      defaultValue,
      length,
      unique,
    });
    console.log(
      `      ${name.padEnd(35)} ${(type + length).padEnd(25)} ${nullable}${defaultValue}${unique}`,
    );
  }

  // Extract primary key
  const primaryKeyRegex = /@PrimaryGeneratedColumn\([^)]*\)[\s\n]+(\w+):/g;
  let pkMatch;
  while ((pkMatch = primaryKeyRegex.exec(content)) !== null) {
    const name = pkMatch[1];
    tableInfo.columns.push({
      name,
      type: 'integer',
      nullable: 'NOT NULL',
      defaultValue: '',
      primary: true,
    });
    console.log(
      `      ${name.padEnd(35)} ${'integer'.padEnd(25)} NOT NULL PRIMARY KEY AUTO_INCREMENT`,
    );
  }

  // Extract timestamps
  const createDateRegex = /@CreateDateColumn\(\)[\s\n]+(\w+):/g;
  const updateDateRegex = /@UpdateDateColumn\(\)[\s\n]+(\w+):/g;

  let createMatch;
  while ((createMatch = createDateRegex.exec(content)) !== null) {
    const name = createMatch[1];
    tableInfo.columns.push({
      name,
      type: 'timestamp',
      nullable: 'NOT NULL',
      defaultValue: ' DEFAULT CURRENT_TIMESTAMP',
    });
    console.log(
      `      ${name.padEnd(35)} ${'timestamp'.padEnd(25)} NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
  }

  let updateMatch;
  while ((updateMatch = updateDateRegex.exec(content)) !== null) {
    const name = updateMatch[1];
    tableInfo.columns.push({
      name,
      type: 'timestamp',
      nullable: 'NOT NULL',
      defaultValue: ' DEFAULT CURRENT_TIMESTAMP',
    });
    console.log(
      `      ${name.padEnd(35)} ${'timestamp'.padEnd(25)} NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
  }

  // Extract relations
  console.log('\n  RELATIONS:');
  const relationRegex =
    /@(OneToMany|ManyToOne|OneToOne|ManyToMany)\(\(\) => ([^,]+),([^)]+)\)[\s\S]*?(\w+):/g;
  let relMatch;
  while ((relMatch = relationRegex.exec(content)) !== null) {
    const relationType = relMatch[1];
    const targetEntity = relMatch[2].trim();
    const inverseSide = relMatch[3];
    const propertyName = relMatch[4];

    tableInfo.relations.push({
      type: relationType,
      target: targetEntity,
      property: propertyName,
    });
    console.log(
      `      ${propertyName.padEnd(30)} ${relationType.padEnd(15)} → ${targetEntity}`,
    );

    // Check for cascade options
    const cascadeMatch = content.match(
      new RegExp(`${propertyName}:[\\s\\S]{0,200}cascade:\\s*true`, 'm'),
    );
    if (cascadeMatch) {
      console.log(`        ${''.padEnd(28)} CASCADE: true`);
    }

    // Check for onDelete
    const onDeleteMatch = content.match(
      new RegExp(`${propertyName}:[\\s\\S]{0,200}onDelete:\\s*'([^']+)'`, 'm'),
    );
    if (onDeleteMatch) {
      console.log(`        ${''.padEnd(28)} ON DELETE: ${onDeleteMatch[1]}`);
    }
  }

  // Extract unique constraints
  const uniqueRegex = /@Unique\(\[([^\]]+)\]\)/g;
  let uniqueMatch;
  const uniqueConstraints: string[][] = [];
  while ((uniqueMatch = uniqueRegex.exec(content)) !== null) {
    const columns = uniqueMatch[1]
      .split(',')
      .map((c) => c.trim().replace(/'/g, ''));
    uniqueConstraints.push(columns);
  }

  if (uniqueConstraints.length > 0) {
    console.log('\n  UNIQUE CONSTRAINTS:');
    uniqueConstraints.forEach((cols, idx) => {
      console.log(`      UQ_${tableName}_${idx}: (${cols.join(', ')})`);
    });
  }

  schemaInfo.tables.push(tableInfo);
  console.log('\n');
}

console.log('='.repeat(100));
console.log('\n📊 SCHEMA SUMMARY:');
console.log(`  Total Entity Files: ${schemaInfo.totalEntities}`);
console.log(`  Total Tables: ${schemaInfo.tables.length}`);

let totalColumns = 0;
let totalRelations = 0;
let totalEnums = 0;

for (const table of schemaInfo.tables) {
  totalColumns += table.columns.length;
  totalRelations += table.relations.length;
  totalEnums += table.enums.length;
}

console.log(`  Total Columns: ${totalColumns}`);
console.log(`  Total Relations: ${totalRelations}`);
console.log(`  Total Enums: ${totalEnums}`);

console.log('\n📋 TABLE LIST:');
for (const table of schemaInfo.tables) {
  console.log(
    `  - ${table.tableName.padEnd(45)} (${table.columns.length} columns, ${table.relations.length} relations)`,
  );
}

console.log('\n✅ Schema extraction completed successfully!\n');

// Write to JSON file for comparison
const outputPath = path.join(
  __dirname,
  '..',
  '..',
  'schema-extraction-output.json',
);
fs.writeFileSync(outputPath, JSON.stringify(schemaInfo, null, 2));
console.log(`📄 Schema data saved to: ${outputPath}\n`);
