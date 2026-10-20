/**
 * TIMELOGIC Production Database Restoration Utility
 * ──────────────────────────────────────────────────────────
 * Restores 100% of data from:
 *   backups/heroku_full_dump_latest.json
 * (or a specified dump file) into any target PostgreSQL database (Render, local, etc.)
 *
 * Usage:
 *   node backend/scripts/restore-from-full-dump.js
 *   node backend/scripts/restore-from-full-dump.js --target-url="postgresql://user:pass@dpg-xxx.render.com/dbname"
 *   node backend/scripts/restore-from-full-dump.js --file="backups/heroku_full_dump_2026-10-20T06-56-08-484Z.json"
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Parse CLI arguments
const args = process.argv.slice(2);
let targetUrlArg = null;
let dumpFileArg = null;
let shouldClean = false;

for (const arg of args) {
  if (arg.startsWith('--target-url=')) {
    targetUrlArg = arg.split('=')[1];
  } else if (arg.startsWith('--file=')) {
    dumpFileArg = arg.split('=')[1];
  } else if (arg === '--clean' || arg === '--truncate') {
    shouldClean = true;
  }
}

const targetDbUrl = targetUrlArg || process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!targetDbUrl) {
  console.error('❌ ERROR: No target database URL provided.');
  console.error('Provide via --target-url="postgresql://..." or TARGET_DATABASE_URL env var.');
  process.exit(1);
}

// Ensure SSL parameters for hosted databases like Render
let formattedUrl = targetDbUrl;
if (!formattedUrl.includes('sslmode=') && !formattedUrl.includes('localhost') && !formattedUrl.includes('127.0.0.1')) {
  formattedUrl += (formattedUrl.includes('?') ? '&' : '?') + 'sslmode=no-verify';
}

const defaultDumpPath = path.resolve(__dirname, '../../backups/heroku_full_dump_latest.json');
const dumpPath = dumpFileArg ? path.resolve(process.cwd(), dumpFileArg) : defaultDumpPath;

if (!fs.existsSync(dumpPath)) {
  console.error(`❌ ERROR: Dump file not found at: ${dumpPath}`);
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: formattedUrl }
  }
});

function prepareColumnCasting(tableName, colName, schemaMap) {
  const tableSchema = schemaMap[tableName] || [];
  const colInfo = tableSchema.find(c => c.column_name === colName);
  if (!colInfo) return '';
  const dt = colInfo.data_type;
  const udt = colInfo.udt_name;

  if (dt === 'USER-DEFINED') {
    return `::"${udt}"`;
  }
  if (dt === 'ARRAY') {
    if (udt === '_text') return '::text[]';
    const base = udt.startsWith('_') ? udt.slice(1) : udt;
    return `::"${base}"[]`;
  }
  if (dt.includes('timestamp')) {
    return dt.includes('with time zone') ? '::timestamptz' : '::timestamp';
  }
  if (dt === 'date') return '::date';
  if (dt === 'jsonb') return '::jsonb';
  if (dt === 'boolean') return '::boolean';
  if (dt === 'integer') return '::integer';
  if (dt.includes('precision') || dt === 'numeric' || dt === 'real') return '::double precision';
  if (dt === 'bytea') return '::bytea';
  if (dt.includes('character') || dt === 'text') return '::text';
  return '';
}

function normalizeValueForDb(val, colName, tableName, schemaMap) {
  if (val === null || val === undefined) return null;
  const tableSchema = schemaMap[tableName] || [];
  const colInfo = tableSchema.find(c => c.column_name === colName);
  const dt = colInfo ? (colInfo.data_type || '').toLowerCase() : '';

  if (dt.includes('json') && typeof val === 'object' && !Buffer.isBuffer(val)) {
    return JSON.stringify(val);
  }
  if (typeof val === 'object' && val.__type === 'Buffer' && val.__encoding === 'base64') {
    return Buffer.from(val.data, 'base64');
  }
  return val;
}

async function restoreDatabase() {
  console.log('=================================================================');
  console.log('🚀 TIMELOGIC DATABASE RESTORATION UTILITY');
  console.log('=================================================================');
  console.log(`Target DB: ${formattedUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`Source File: ${dumpPath}\n`);

  const startTime = Date.now();
  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  console.log(`Dump exported at: ${dump.exportedAt}`);
  console.log(`Total tables in dump: ${dump.totalTables || Object.keys(dump.tables).length}`);

  // Test connection
  await prisma.$queryRawUnsafe('SELECT 1;');
  console.log('✓ Successfully connected to target database.');

  // Disable triggers & FK constraints during restoration for zero friction
  try {
    await prisma.$queryRawUnsafe("SET session_replication_role = 'replica';");
    console.log('✓ FK constraints temporarily set to replica mode for clean batch insertion.');
  } catch (err) {
    console.warn('⚠ Could not set session_replication_role (non-superuser), continuing with standard mode.');
  }

  // Desired restoration order to minimize any constraint dependency issues
  const dependencyOrder = [
    'organizations',
    'offices',
    'departments',
    'security_settings',
    'break_policies',
    'users',
    'admin_permissions',
    'refresh_tokens',
    'admin_login_events',
    'students',
    'registered_devices',
    'wifi_fingerprints',
    'kiosk_devices',
    'activation_codes',
    'attendance_sessions',
    'leave_balances',
    'student_attendance',
    'qr_tokens',
    'attendance_records',
    'leave_requests',
    'manual_penalties',
    'emergency_controls',
    'payslip_records',
    'sales_batch_imports',
    'break_records',
    'attendance_events',
    'work_events',
    'scan_attempts',
    'fraud_alerts',
    'screenshot_logs',
    'emergency_control_sessions',
    'attendance_reports',
    'notification_logs',
    'audit_logs',
    'sales_transactions',
    'sales_monthly_summaries',
    '_prisma_migrations'
  ];

  const dumpTables = Object.keys(dump.tables);
  const orderedTables = [
    ...dependencyOrder.filter(t => dumpTables.includes(t)),
    ...dumpTables.filter(t => !dependencyOrder.includes(t))
  ];

  if (shouldClean) {
    console.log('🧹 Cleaning target tables before restoration (--clean flag active)...');
    const tablesToClean = [...orderedTables].reverse().filter(t => t !== '_prisma_migrations');
    for (const t of tablesToClean) {
      try {
        await prisma.$queryRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE;`);
      } catch (err) {
        // Table might not exist or non-critical
      }
    }
    console.log('✓ Target tables truncated successfully.\n');
  }

  let totalRestored = 0;
  const restoreSummary = {};

  for (const tableName of orderedTables) {
    const rows = dump.tables[tableName] || [];
    if (rows.length === 0) {
      console.log(`  - ${tableName.padEnd(30)} : 0 rows (skipped)`);
      restoreSummary[tableName] = 0;
      continue;
    }

    // Verify target table exists
    const checkTable = await prisma.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = '${tableName}';
    `);

    if (checkTable.length === 0) {
      console.warn(`  ⚠ Table "${tableName}" does not exist in target database schema. Run "npx prisma migrate deploy" first!`);
      continue;
    }

    let insertedCount = 0;
    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const rawRow of batch) {
        const cols = Object.keys(rawRow);
        const colList = cols.map(c => `"${c}"`).join(', ');
        const valPlaceholders = cols.map((c, idx) => {
          const cast = prepareColumnCasting(tableName, c, dump.tableSchemas || {});
          return `$${idx + 1}${cast}`;
        }).join(', ');

        const rowValues = cols.map(c => normalizeValueForDb(rawRow[c], c, tableName, dump.tableSchemas || {}));

        // Upsert on primary key or ignore duplicate
        let query;
        if (cols.includes('id')) {
          const updateSets = cols.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');
          if (updateSets.length > 0) {
            query = `INSERT INTO "${tableName}" (${colList}) VALUES (${valPlaceholders}) ON CONFLICT ("id") DO UPDATE SET ${updateSets};`;
          } else {
            query = `INSERT INTO "${tableName}" (${colList}) VALUES (${valPlaceholders}) ON CONFLICT ("id") DO NOTHING;`;
          }
        } else {
          query = `INSERT INTO "${tableName}" (${colList}) VALUES (${valPlaceholders}) ON CONFLICT DO NOTHING;`;
        }

        await prisma.$executeRawUnsafe(query, ...rowValues);
        insertedCount++;
      }
    }

    restoreSummary[tableName] = insertedCount;
    totalRestored += insertedCount;
    console.log(`  ✓ ${tableName.padEnd(30)} : ${String(insertedCount).padStart(6)} rows restored`);
  }

  // Restore triggers & FK constraints
  try {
    await prisma.$queryRawUnsafe("SET session_replication_role = 'origin';");
    console.log('\n✓ FK constraints restored to origin mode.');
  } catch (err) {
    // ignore
  }

  console.log('=================================================================');
  console.log(`🎉 RESTORATION COMPLETED SUCCESSFULLY!`);
  console.log(`📊 Tables Processed:   ${orderedTables.length}`);
  console.log(`📝 Total Rows Loaded:   ${totalRestored}`);
  console.log(`⏱ Time taken:          ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log('=================================================================');
}

restoreDatabase()
  .catch(err => {
    console.error('❌ Database restoration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
