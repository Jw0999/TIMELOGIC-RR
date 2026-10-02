const PayrollService = require('../services/PayrollService');
const logger = require('../config/logger');

class PayrollController {
  async getOverview(req, res) {
    try {
      const orgId = req.user.orgId;
      const { year, month } = req.query;
      const data = await PayrollService.getEmployeesWithSalary(orgId, year, month);
      res.json({ status: 'success', data });
    } catch (err) {
      logger.error('Error fetching payroll overview:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async setEmployeeSalary(req, res) {
    try {
      const orgId = req.user.orgId;
      const employeeId = req.params.id;
      const data = await PayrollService.setEmployeeSalary(orgId, employeeId, req.body);
      res.json({ status: 'success', data });
    } catch (err) {
      logger.error('Error setting employee salary:', err);
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  async getSettings(req, res) {
    try {
      const orgId = req.user.orgId;
      const data = await PayrollService.getPayrollSettings(orgId);
      res.json({ status: 'success', data });
    } catch (err) {
      logger.error('Error getting payroll settings:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async updateSettings(req, res) {
    try {
      const orgId = req.user.orgId;
      const data = await PayrollService.updatePayrollSettings(orgId, req.body);
      res.json({ status: 'success', data });
    } catch (err) {
      logger.error('Error updating payroll settings:', err);
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  async calculatePayroll(req, res) {
    try {
      const orgId = req.user.orgId;
      const { year, month } = req.body;
      const data = await PayrollService.calculateMonthlyPayroll(orgId, year, month);
      res.json({ status: 'success', data });
    } catch (err) {
      logger.error('Error calculating monthly payroll:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async downloadPayslipPdf(req, res) {
    try {
      const payslipId = req.params.id;
      const { filePath, fileName } = await PayrollService.generatePayslipPdf(payslipId);
      res.download(filePath, fileName);
    } catch (err) {
      logger.error('Error downloading payslip PDF:', err);
      res.status(404).json({ status: 'error', message: err.message });
    }
  }

  async sendWhatsApp(req, res) {
    try {
      const payslipId = req.params.id;
      const data = await PayrollService.sendPayslipWhatsApp(payslipId);
      res.json({ status: 'success', data });
    } catch (err) {
      logger.error('Error sending WhatsApp payslip:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async batchSendWhatsApp(req, res) {
    try {
      const orgId = req.user.orgId;
      const { year, month } = req.body;
      const data = await PayrollService.batchSendMonthlyWhatsApp(orgId, year, month);
      res.json({ status: 'success', data });
    } catch (err) {
      logger.error('Error in batch WhatsApp send:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new PayrollController();
