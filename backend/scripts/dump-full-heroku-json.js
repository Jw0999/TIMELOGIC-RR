const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const LIVE_HEROKU_DB_URL = 'postgresql://u3fojpe4c5gl2c:p4e045d518c8f34826cc274e1a2ffe0c19c649e7716d1bba9e334c12f24c24bd3@c6fm2vuk8tpg6u.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d9jmh5g0q06sen?sslmode=no-verify';
const HEROKU_DB_URL = process.env.HEROKU_DATABASE_URL || LIVE_HEROKU_DB_URL;

const prisma = new PrismaClient({
  datasources: {
    db: { url: HEROKU_DB_URL }
  }
});

function serializeValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'bigint') return val.toString();
  if (Buffer.isBuffer(val)) {
    return { __type: 'Buffer', __encoding: 'base64', data: val.toString('base64') };
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (Array.isArray(val)) {
    return val.map(serializeValue);
  }
  if (typeof val === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = serializeValue(v);
    }
    return res;
  }
  return val;
}

async function dumpFullDatabase() {
  console.log('=================================================================');
  console.log('🚀 TIMELOGIC HEROKU DATABASE FULL JSON DUMP UTILITY');
  console.log('=================================================================');
  console.log(`Connecting to: ${HEROKU_DB_URL.replace(/:[^:@]+@/, ':****@')}`);

  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '../../backups');
  const tableDir = path.join(backupDir, `heroku_tables_${timestamp}`);

  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  if (!fs.existsSync(tableDir)) fs.mkdirSync(tableDir, { recursive: true });

  // 1. Discover all tables
  const tablesResult = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const tableNames = tablesResult.map(t => t.table_name);
  console.log(`Discovered ${tableNames.length} base tables in 'public' schema:\n`);

  const dump = {
    exportedAt: new Date().toISOString(),
    databaseSource: 'Heroku PostgreSQL (RDS)',
    totalTables: tableNames.length,
    tableCounts: {},
    tableSchemas: {},
    tables: {}
  };

  let totalRecordsCount = 0;

  for (const tableName of tableNames) {
    // Get column types
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);
    dump.tableSchemas[tableName] = columns;

    // Count rows
    const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS cnt FROM "${tableName}";`);
    const expectedCount = Number(countResult[0].cnt);

    // Fetch all rows
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}";`);
    if (rows.length !== expectedCount) {
      throw new Error(`Integrity mismatch on table ${tableName}: expected ${expectedCount} rows, fetched ${rows.length}`);
    }

    // Serialize rows safely
    const serializedRows = rows.map(row => {
      const serialized = {};
      for (const [col, val] of Object.entries(row)) {
        serialized[col] = serializeValue(val);
      }
      return serialized;
    });

    dump.tables[tableName] = serializedRows;
    dump.tableCounts[tableName] = serializedRows.length;
    totalRecordsCount += serializedRows.length;

    // Also write individual table file
    const tableFilePath = path.join(tableDir, `${tableName}.json`);
    fs.writeFileSync(tableFilePath, JSON.stringify(serializedRows, null, 2), 'utf8');

    console.log(`  ✓ ${tableName.padEnd(30)} : ${String(serializedRows.length).padStart(6)} rows dumped`);
  }

  // Write master JSON files
  const dumpFilePath = path.join(backupDir, `heroku_full_dump_${timestamp}.json`);
  const latestDumpFilePath = path.join(backupDir, `heroku_full_dump_latest.json`);
  const manifestFilePath = path.join(backupDir, `heroku_dump_manifest_${timestamp}.json`);

  const manifest = {
    exportedAt: dump.exportedAt,
    databaseSource: dump.databaseSource,
    totalTables: dump.totalTables,
    totalRecords: totalRecordsCount,
    durationMs: Date.now() - startTime,
    tableCounts: dump.tableCounts,
    tableSchemas: dump.tableSchemas
  };

  console.log('\nWriting master JSON backup files...');
  fs.writeFileSync(dumpFilePath, JSON.stringify(dump, null, 2), 'utf8');
  fs.writeFileSync(latestDumpFilePath, JSON.stringify(dump, null, 2), 'utf8');
  fs.writeFileSync(manifestFilePath, JSON.stringify(manifest, null, 2), 'utf8');

  const stats = fs.statSync(dumpFilePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('=================================================================');
  console.log(`🎉 SUCCESS! Complete Heroku database dumped without any missing data!`);
  console.log(`📊 Total Tables Dumped:  ${tableNames.length}`);
  console.log(`📝 Total Records:        ${totalRecordsCount}`);
  console.log(`💾 JSON File Size:       ${sizeMB} MB`);
  console.log(`📁 Saved to:`);
  console.log(`   - Master:     ${dumpFilePath}`);
  console.log(`   - Latest sym: ${latestDumpFilePath}`);
  console.log(`   - Manifest:   ${manifestFilePath}`);
  console.log(`   - Table dir:  ${tableDir}/ (*.json per table)`);
  console.log(`⏱ Time taken:          ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log('=================================================================');
}

dumpFullDatabase()
  .catch(err => {
    console.error('❌ Database dump failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
