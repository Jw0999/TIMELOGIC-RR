/**
 * Post-Restoration Database Verification Script
 * Validates table presence, row counts, migrations, and essential constraints
 * against the known production baseline from the PostgreSQL dump.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EXPECTED_MINIMUM_COUNTS = {
  organizations: 2,
  users: 14,
  departments: 5,
  offices: 1,
  attendance_records: 320,
  attendance_events: 303,
  attendance_sessions: 55,
  break_records: 121,
  manual_penalties: 16,
  salary_additions: 4,
  payslip_records: 21,
  fraud_alerts: 30,
  audit_logs: 175,
};

async function verifyRestoration() {
  console.log('=====================================================');
  console.log('  TIMELOGIC DATABASE RESTORATION INTEGRITY AUDIT');
  console.log('=====================================================\n');

  let passed = true;

  // 1. Check migrations table
  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      ORDER BY finished_at ASC;
    `;
    console.log(`[+] Migrations Applied: ${migrations.length} migration records found in _prisma_migrations`);
    const latest = migrations[migrations.length - 1];
    console.log(`[+] Latest Migration:   ${latest?.migration_name || 'NONE'}`);
    if (migrations.length < 46) {
      console.warn(`[!] Warning: Expected at least 46 migrations, found ${migrations.length}`);
    }
  } catch (err) {
    console.error(`[-] Error verifying _prisma_migrations:`, err.message);
    passed = false;
  }

  // 2. Check table row counts
  console.log('\n--- Checking Baseline Table Row Counts ---');
  for (const [table, expected] of Object.entries(EXPECTED_MINIMUM_COUNTS)) {
    try {
      const res = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${table}"`);
      const count = res[0]?.count ?? 0;
      const status = count >= expected ? '[✓]' : '[✗]';
      console.log(`  ${status} ${table.padEnd(25)}: ${String(count).padStart(5)} (Expected >= ${expected})`);
      if (count < expected) {
        passed = false;
      }
    } catch (err) {
      console.error(`  [✗] ${table.padEnd(25)}: FAILED (${err.message})`);
      passed = false;
    }
  }

  // 3. Verify user authentication integrity (passwords are bcrypt hashes, not corrupted/null)
  console.log('\n--- Checking User Authentication Integrity ---');
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, passwordHash: true, status: true },
    });
    console.log(`[+] Total users retrieved: ${users.length}`);
    let validHashes = 0;
    for (const u of users) {
      if (u.passwordHash && u.passwordHash.startsWith('$2')) {
        validHashes++;
      } else {
        console.warn(`[!] Invalid password hash format for user: ${u.email}`);
        passed = false;
      }
    }
    console.log(`[+] Valid bcrypt password hashes: ${validHashes} / ${users.length}`);
  } catch (err) {
    console.error(`[-] Error validating users:`, err.message);
    passed = false;
  }

  // 4. Verify Organizations and Admin linkage
  console.log('\n--- Checking Organization Structure ---');
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true, offices: true, departments: true },
        },
      },
    });
    for (const o of orgs) {
      console.log(`[+] Org: "${o.name}" (ID: ${o.id})`);
      console.log(`    Users: ${o._count.users}, Offices: ${o._count.offices}, Departments: ${o._count.departments}`);
    }
  } catch (err) {
    console.error(`[-] Error validating organizations:`, err.message);
    passed = false;
  }

  console.log('\n=====================================================');
  if (passed) {
    console.log('  STATUS: RESTORATION VERIFIED SUCCESSFULLY (ALL CHECKS PASSED)');
  } else {
    console.log('  STATUS: RESTORATION VERIFICATION FAILED SOME CHECKS');
  }
  console.log('=====================================================\n');

  await prisma.$disconnect();
  process.exit(passed ? 0 : 1);
}

verifyRestoration().catch((err) => {
  console.error('Fatal verification error:', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
