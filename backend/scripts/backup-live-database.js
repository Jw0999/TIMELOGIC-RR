const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const LIVE_DB_URL = process.env.DATABASE_URL || 'postgresql://timelogic_db_user:U0pQSC6tV83OhMbBzYKcj8JOeezmleC0@dpg-dajj1e8ae00c73a5o8p0-a.oregon-postgres.render.com/timelogic_db?sslmode=require';

const prisma = new PrismaClient({
  datasources: {
    db: { url: LIVE_DB_URL }
  }
});

async function backupLiveDatabase() {
  console.log('Connecting to live Render database for full snapshot backup...');
  
  const tables = [
    'organization',
    'office',
    'department',
    'user',
    'adminPermission',
    'attendanceSession',
    'attendanceRecord',
    'breakRecord',
    'student',
    'studentAttendance',
    'leaveBalance',
    'leaveRequest',
    'breakPolicy',
    'securitySettings',
    'wiFiFingerprint',
    'registeredDevice',
    'scanAttempt',
    'fraudAlert',
    'adminLoginEvent',
    'refreshToken'
  ];

  const backupData = {
    exportedAt: new Date().toISOString(),
    databaseUrl: LIVE_DB_URL.replace(/:[^:@]+@/, ':****@'), // redact password
    counts: {},
    data: {}
  };

  for (const model of tables) {
    if (typeof prisma[model]?.findMany === 'function') {
      try {
        const records = await prisma[model].findMany();
        backupData.data[model] = records;
        backupData.counts[model] = records.length;
        console.log(`  ✓ ${model}: ${records.length} records`);
      } catch (err) {
        console.warn(`  ⚠ ${model}: skipped (${err.message})`);
      }
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const filename = `live_render_backup_${timestamp}.json`;
  const filePath = path.join(backupDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n🎉 Full live backup saved successfully to:\n   ${filePath}`);
  console.log(`Summary of backed up tables:`, backupData.counts);
}

backupLiveDatabase()
  .catch((err) => {
    console.error('❌ Live backup failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
