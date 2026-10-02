/**
 * Payroll Scheduler
 * Runs periodically to trigger automated monthly payroll calculation,
 * PDF generation, and WhatsApp dispatch for organizations whose
 * salaryPayoutDay matches today.
 */

const PayrollService = require('../services/PayrollService');
const { redis } = require('../config/redis');
const logger = require('../config/logger');

let _payrollTimer = null;

async function checkPaydayRun() {
  try {
    const now = new Date();
    // Run after 08:00 in the morning
    if (now.getHours() < 8) return;

    const dateKey = `tl:payday:run:${now.toISOString().split('T')[0]}`;
    const alreadyRun = await redis.get(dateKey).catch(() => null);

    if (alreadyRun) {
      return;
    }

    logger.info('[PayrollScheduler] Starting automated daily payday evaluation...');
    const results = await PayrollService.executeAutomatedPaydayCron();
    
    // Mark as run for today (expire in 48h)
    await redis.set(dateKey, JSON.stringify({ executedAt: new Date(), count: results.length }), 'EX', 172800).catch(() => null);
    
    logger.info(`[PayrollScheduler] Finished payday evaluation. Processed ${results.length} organizations.`);
  } catch (err) {
    logger.error('[PayrollScheduler] Error during payday scheduler run:', err);
  }
}

function startPayrollScheduler() {
  if (_payrollTimer) return;
  // Initial check after 30 seconds
  setTimeout(checkPaydayRun, 30000);
  // Check every 30 minutes
  _payrollTimer = setInterval(checkPaydayRun, 30 * 60 * 1000);
  logger.info('[PayrollScheduler] Automated payroll scheduler started (checks every 30m)');
}

function stopPayrollScheduler() {
  if (_payrollTimer) {
    clearInterval(_payrollTimer);
    _payrollTimer = null;
    logger.info('[PayrollScheduler] Automated payroll scheduler stopped');
  }
}

module.exports = {
  startPayrollScheduler,
  stopPayrollScheduler,
};
