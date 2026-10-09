const assert = require('assert');
const crypto = require('crypto');
const XLSX = require('xlsx');
const { prisma } = require('../src/config/database');
const WorkforceRecordEngine = require('../src/services/WorkforceRecordEngine');
const SalesImportService = require('../src/services/SalesImportService');
const SalesAnalyticsService = require('../src/services/SalesAnalyticsService');

async function runVerification() {
  console.log('--- STARTING VERIFICATION: TRUSTED WORKFORCE RECORD & SALES INTELLIGENCE ---');

  // Find or create test organization and employee
  let org = await prisma.organization.findFirst({
    where: { name: 'TimeLogic Test Org' },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'TimeLogic Test Org',
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: new Date(),
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
  }

  let employee = await prisma.user.findFirst({
    where: { orgId: org.id, role: 'EMPLOYEE' },
  });
  if (!employee) {
    employee = await prisma.user.create({
      data: {
        orgId: org.id,
        email: `tester-${Date.now()}@timelogic.test`,
        passwordHash: 'dummy',
        firstName: 'Ada',
        lastName: 'Lovelace',
        employeeCode: `EMP-${Date.now()}`,
        role: 'EMPLOYEE',
      },
    });
  }

  // ── TEST 1: WORKFORCE RECORD ENGINE (12-STAGE TIMELINE) ──────────────────
  console.log('\n[1] Testing Workforce Record Engine 12-Stage Timeline...');
  const today = new Date();
  const timeline = await WorkforceRecordEngine.getEmployeeTimeline(org.id, employee.id, {
    date: today.toISOString().slice(0, 10),
  });

  assert(timeline.employee, 'Timeline should include employee profile');
  assert(Array.isArray(timeline.stages), 'Timeline must include stages array');
  assert.strictEqual(timeline.stages.length, 12, 'Timeline must contain exactly 12 stages of custody');
  console.log(`  ✓ Successfully generated 12-stage custody chain for ${timeline.employee.name}`);
  console.log(`  ✓ Stage 1: ${timeline.stages[0].title} [${timeline.stages[0].status}]`);
  console.log(`  ✓ Stage 12: ${timeline.stages[11].title} [${timeline.stages[11].status}]`);

  // ── TEST 2: SALES INTELLIGENCE - EXCEL PARSE & COLUMN DETECTION ──────────
  console.log('\n[2] Testing Sales Import Service: Excel (.xlsx) Generation & Auto-Detection...');
  const testSalesData = [
    { 'Transaction Date': '2026-01-05', 'Item Name': 'Enterprise Server License', 'Units Sold': 2, 'Selling Price': 750000, 'Cost Price': 400000, 'Category': 'Software' },
    { 'Transaction Date': '2026-01-12', 'Item Name': 'Biometric Kiosk Terminal', 'Units Sold': 5, 'Selling Price': 320000, 'Cost Price': 200000, 'Category': 'Hardware' },
    { 'Transaction Date': '2026-01-20', 'Item Name': 'Support Subscription', 'Units Sold': 10, 'Selling Price': 50000, 'Cost Price': 10000, 'Category': 'Services' },
    { 'Transaction Date': '2026-01-28', 'Item Name': 'Biometric Kiosk Terminal', 'Units Sold': 3, 'Selling Price': 320000, 'Cost Price': 200000, 'Category': 'Hardware' },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(testSalesData);
  XLSX.utils.book_append_sheet(wb, ws, 'January Sales');
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Preview test
  const preview = await SalesImportService.preview(xlsxBuffer, 'January_2026_Sales.xlsx');
  assert.strictEqual(preview.totalRows, 4, 'Preview should detect 4 rows');
  assert(preview.detectedMapping.transactionDate, 'Should auto-detect transactionDate column');
  assert(preview.detectedMapping.productName, 'Should auto-detect productName column');
  assert(preview.detectedMapping.unitPrice, 'Should auto-detect unitPrice column');
  assert(preview.hasCostData, 'Should detect cost data present');
  console.log('  ✓ Column heuristic auto-mapped columns with confidence:', preview.confidence);
  console.log('  ✓ Detected mappings:', preview.detectedMapping);

  // ── TEST 3: SALES IMPORT & DEDUPLICATION ─────────────────────────────────
  console.log('\n[3] Testing Sales Import & Duplicate Rejection...');
  const importResult = await SalesImportService.importData({
    orgId: org.id,
    userId: employee.id,
    fileBuffer: xlsxBuffer,
    fileName: 'January_2026_Sales.xlsx',
  });

  assert.strictEqual(importResult.importedRows, 4, 'First import should import all 4 valid records');
  assert.strictEqual(importResult.skippedRows, 0, 'First import should have 0 skipped records');
  console.log(`  ✓ Imported ${importResult.importedRows} records for detected period: ${importResult.detectedPeriod}`);

  // Re-import identical file: must skip all 4 duplicates
  console.log('\n[4] Re-uploading identical file to test duplicate detection...');
  const secondImport = await SalesImportService.importData({
    orgId: org.id,
    userId: employee.id,
    fileBuffer: xlsxBuffer,
    fileName: 'January_2026_Sales_Duplicate.xlsx',
  });

  assert.strictEqual(secondImport.importedRows, 0, 'Re-import must import 0 new records');
  assert.strictEqual(secondImport.skippedRows, 4, 'Re-import must skip all 4 duplicate records');
  console.log(`  ✓ Duplicate prevention verified! Skipped ${secondImport.skippedRows} duplicates.`);

  // ── TEST 4: CSV IMPORT & MULTI-MONTH NON-DESTRUCTIVE PARTITIONING ────────
  console.log('\n[5] Testing February CSV Import (Multi-Month Historical Persistence)...');
  const febCsv = `Date,Product,Quantity,Price,Cost,Category\n2026-02-04,Cloud Infrastructure,4,250000,100000,Hosting\n2026-02-18,Biometric Kiosk Terminal,2,320000,200000,Hardware`;
  const csvBuffer = Buffer.from(febCsv, 'utf8');

  const febResult = await SalesImportService.importData({
    orgId: org.id,
    userId: employee.id,
    fileBuffer: csvBuffer,
    fileName: 'February_2026_Sales.csv',
  });

  assert.strictEqual(febResult.importedRows, 2, 'February import should succeed with 2 rows');
  console.log(`  ✓ February data stored under separate monthly partition!`);

  // ── TEST 5: ANALYTICS ENGINE KPIs & TOP PRODUCTS ────────────────────────
  console.log('\n[6] Testing Analytics Engine KPIs, Top Products & Profitability...');
  const janAnalytics = await SalesAnalyticsService.getDashboardAnalytics(org.id, { year: 2026, month: 1 });
  assert(janAnalytics.hasData, 'Analytics should have data for January 2026');
  assert(janAnalytics.kpis.totalRevenue > 0, 'Total revenue must be positive');
  assert(janAnalytics.kpis.totalProfit > 0, 'Total profit must be positive');
  assert(janAnalytics.kpis.hasCostData, 'Has cost data must be true');
  assert(janAnalytics.topProducts.byRevenue.length > 0, 'Top products by revenue must be populated');
  assert(janAnalytics.monthlyComparison.length >= 2, 'Monthly comparison must show both January and February');
  console.log(`  ✓ January Revenue: ₦${janAnalytics.kpis.totalRevenue.toLocaleString()}`);
  console.log(`  ✓ January Profit: ₦${janAnalytics.kpis.totalProfit.toLocaleString()} (Margin: ${janAnalytics.kpis.profitMargin}%)`);
  console.log(`  ✓ Star Performer: ${janAnalytics.topProducts.byRevenue[0].name} (₦${janAnalytics.topProducts.byRevenue[0].revenue.toLocaleString()})`);
  console.log(`  ✓ Generated ${janAnalytics.businessInsights.length} deterministic business insights!`);

  // Clean up test batches
  console.log('\n[7] Cleaning up test import batches...');
  await SalesAnalyticsService.deleteImportBatch(org.id, importResult.batchId);
  await SalesAnalyticsService.deleteImportBatch(org.id, secondImport.batchId);
  await SalesAnalyticsService.deleteImportBatch(org.id, febResult.batchId);
  console.log('  ✓ Test batches deleted and summaries recalculated.');

  console.log('\n======================================================');
  console.log(' ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('======================================================');
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  });
