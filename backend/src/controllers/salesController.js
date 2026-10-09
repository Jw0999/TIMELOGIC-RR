const ExcelJS = require('exceljs');
const SalesImportService = require('../services/SalesImportService');
const SalesAnalyticsService = require('../services/SalesAnalyticsService');

const getOrganizationId = (req) => {
  if (req.user.role !== 'SUPER_ADMIN') return req.user.orgId;
  return req.headers['x-organization-id'] || req.query.orgId || (req.user.orgId !== 'platform-org' ? req.user.orgId : null);
};

const getDashboard = async (req, res, next) => {
  try {
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection required.' });
    const data = await SalesAnalyticsService.getDashboardAnalytics(orgId, {
      year: req.query.year,
      month: req.query.month,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getPeriods = async (req, res, next) => {
  try {
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection required.' });
    const data = await SalesAnalyticsService.getAvailablePeriods(orgId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const previewUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a sales file to upload.' });
    }
    let customMapping = null;
    if (req.body.columnMapping) {
      try {
        customMapping = typeof req.body.columnMapping === 'string'
          ? JSON.parse(req.body.columnMapping)
          : req.body.columnMapping;
      } catch (_) {}
    }
    const previewData = await SalesImportService.preview(req.file.buffer, req.file.originalname, customMapping);
    res.json({ success: true, data: previewData });
  } catch (error) {
    next(error);
  }
};

const importUpload = async (req, res, next) => {
  try {
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection required.' });

    const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one sales file to upload.' });
    }

    let columnMapping = null;
    if (req.body.columnMapping) {
      try {
        columnMapping = typeof req.body.columnMapping === 'string'
          ? JSON.parse(req.body.columnMapping)
          : req.body.columnMapping;
      } catch (_) {}
    }

    // Process all files independently to respect each file's specific dates and avoid cross-contamination
    const fileResults = [];
    const errors = [];
    let totalImportedRows = 0;
    let totalSkippedRows = 0;
    let totalRevenue = 0;
    const allAffectedMonths = new Set();
    const periodsSet = new Set();
    let anyCostData = false;

    for (const f of files) {
      try {
        const result = await SalesImportService.importData({
          orgId,
          userId: req.user.id,
          fileBuffer: f.buffer,
          fileName: f.originalname,
          columnMapping,
        });
        fileResults.push(result);
        totalImportedRows += result.importedRows;
        totalSkippedRows += result.skippedRows;
        totalRevenue += (result.totalRevenue || 0);
        if (result.hasCostData) anyCostData = true;
        if (result.detectedPeriod) periodsSet.add(result.detectedPeriod);
        if (result.affectedMonths) {
          result.affectedMonths.forEach((m) => allAffectedMonths.add(m));
        }
      } catch (err) {
        errors.push({ fileName: f.originalname, error: err.message });
      }
    }

    if (fileResults.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.map((e) => `${e.fileName}: ${e.error}`).join(' | '),
        errors,
      });
    }

    const detectedPeriodStr = Array.from(periodsSet).join(', ') || 'Historical Sales';

    res.json({
      success: true,
      message: `Processed ${files.length} file(s): ${totalImportedRows.toLocaleString()} new records imported (${totalSkippedRows.toLocaleString()} duplicates skipped).`,
      data: {
        totalFiles: files.length,
        successfulFiles: fileResults.length,
        failedFiles: errors.length,
        importedRows: totalImportedRows,
        skippedRows: totalSkippedRows,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        detectedPeriod: detectedPeriodStr,
        hasCostData: anyCostData,
        affectedMonths: Array.from(allAffectedMonths),
        fileSummaries: fileResults,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getRawData = async (req, res, next) => {
  try {
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection required.' });
    const data = await SalesAnalyticsService.getRawTransactions(orgId, {
      year: req.query.year,
      month: req.query.month,
      search: req.query.search,
      category: req.query.category,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getImports = async (req, res, next) => {
  try {
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection required.' });
    const data = await SalesAnalyticsService.getImportHistory(orgId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const deleteBatch = async (req, res, next) => {
  try {
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection required.' });
    const result = await SalesAnalyticsService.deleteImportBatch(orgId, req.params.batchId);
    res.json({ success: true, message: 'Import batch deleted and historical summaries updated.', data: result });
  } catch (error) {
    next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection required.' });
    const analytics = await SalesAnalyticsService.getDashboardAnalytics(orgId, {
      year: req.query.year,
      month: req.query.month,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TimeLogic Sales Intelligence';
    workbook.created = new Date();

    // Sheet 1: Executive Summary
    const summarySheet = workbook.addWorksheet('Executive Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 32 },
      { header: 'Value', key: 'value', width: 25 },
    ];
    summarySheet.addRow({ metric: 'Reporting Period', value: analytics.period?.label || 'All Time' });
    summarySheet.addRow({ metric: 'Total Revenue', value: `₦${analytics.kpis.totalRevenue.toLocaleString()}` });
    summarySheet.addRow({ metric: 'Total Profit', value: analytics.kpis.totalProfit !== null ? `₦${analytics.kpis.totalProfit.toLocaleString()}` : 'Cost Data Unavailable' });
    summarySheet.addRow({ metric: 'Profit Margin', value: analytics.kpis.profitMargin !== null ? `${analytics.kpis.profitMargin}%` : 'N/A' });
    summarySheet.addRow({ metric: 'Units Sold', value: analytics.kpis.totalUnitsSold.toLocaleString() });
    summarySheet.addRow({ metric: 'Unique Products', value: analytics.kpis.uniqueProducts.toLocaleString() });
    summarySheet.addRow({ metric: 'Total Transactions', value: analytics.kpis.totalTransactions.toLocaleString() });
    summarySheet.addRow({ metric: 'Average Order Value (AOV)', value: `₦${analytics.kpis.averageOrderValue.toLocaleString()}` });

    // Sheet 2: Top Products
    const prodSheet = workbook.addWorksheet('Product Performance');
    prodSheet.columns = [
      { header: 'Product Name', key: 'name', width: 35 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Units Sold', key: 'unitsSold', width: 14 },
      { header: 'Revenue (NGN)', key: 'revenue', width: 18 },
      { header: 'Profit (NGN)', key: 'profit', width: 18 },
      { header: 'Margin %', key: 'margin', width: 14 },
      { header: 'Share of Sales %', key: 'shareOfRevenue', width: 16 },
    ];
    analytics.productPerformance?.forEach((p) => {
      prodSheet.addRow({
        name: p.name,
        category: p.category,
        unitsSold: p.unitsSold,
        revenue: p.revenue,
        profit: p.profit !== null ? p.profit : 'N/A',
        margin: p.margin !== null ? `${p.margin}%` : 'N/A',
        shareOfRevenue: `${p.shareOfRevenue}%`,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="TimeLogic_Sales_Intelligence_${Date.now()}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection required.' });
    const { rows } = await SalesAnalyticsService.getRawTransactions(orgId, {
      year: req.query.year,
      month: req.query.month,
      limit: 10000,
    });

    const csvHeaders = ['Date', 'Invoice ID', 'Product', 'SKU', 'Category', 'Quantity', 'Unit Price', 'Revenue', 'Cost', 'Profit', 'Customer'];
    const csvRows = [csvHeaders.join(',')];

    for (const r of rows) {
      const line = [
        r.transactionDate ? new Date(r.transactionDate).toISOString().slice(0, 10) : '',
        `"${(r.invoiceId || '').replace(/"/g, '""')}"`,
        `"${(r.productName || '').replace(/"/g, '""')}"`,
        `"${(r.productSku || '').replace(/"/g, '""')}"`,
        `"${(r.categoryName || '').replace(/"/g, '""')}"`,
        r.quantity,
        r.unitPrice,
        r.revenue,
        r.unitCost !== null ? r.unitCost : '',
        r.profit !== null ? r.profit : '',
        `"${(r.customerName || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(line.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="TimeLogic_Sales_Data_${Date.now()}.csv"`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    next(error);
  }
};

const downloadSampleTemplate = async (req, res, next) => {
  try {
    const format = (req.query.format || 'excel').toLowerCase();
    const sampleData = [
      { date: '2026-10-01', invoice: 'INV-1001', product: 'A4 Printing Paper (Carton)', category: 'Stationery', qty: 5, price: 8500, amount: 42500, cost: 6500 },
      { date: '2026-10-01', invoice: 'INV-1002', product: 'Color Photocopying Service', category: 'Printing', qty: 25, price: 200, amount: 5000, cost: 80 },
      { date: '2026-10-02', invoice: 'INV-1003', product: 'Graphic Design & Layout', category: 'Design', qty: 1, price: 15000, amount: 15000, cost: 0 },
      { date: '2026-10-02', invoice: 'INV-1004', product: 'ID Card Lamination', category: 'Services', qty: 10, price: 500, amount: 5000, cost: 150 },
      { date: '2026-10-03', invoice: 'INV-1005', product: 'Large Format Banner Print', category: 'Printing', qty: 2, price: 12000, amount: 24000, cost: 7000 },
    ];

    if (format === 'csv') {
      const headers = ['Date', 'Invoice ID', 'Product Name', 'Category', 'Quantity', 'Unit Price', 'Total Sales Amount', 'Cost Price'];
      const lines = [headers.join(',')];
      for (const s of sampleData) {
        lines.push([s.date, s.invoice, `"${s.product}"`, s.category, s.qty, s.price, s.amount, s.cost].join(','));
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="TimeLogic_Sales_Template.csv"');
      return res.send(lines.join('\n'));
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Records Template');
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Invoice / Ref ID', key: 'invoice', width: 18 },
      { header: 'Product Name', key: 'product', width: 32 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Quantity', key: 'qty', width: 12 },
      { header: 'Unit Price', key: 'price', width: 15 },
      { header: 'Total Sales Amount', key: 'amount', width: 20 },
      { header: 'Cost Price (Optional)', key: 'cost', width: 22 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };

    sampleData.forEach((s) => {
      sheet.addRow(s);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="TimeLogic_Sales_Template.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getPeriods,
  previewUpload,
  importUpload,
  getRawData,
  getImports,
  deleteBatch,
  exportExcel,
  exportCsv,
  downloadSampleTemplate,
};
