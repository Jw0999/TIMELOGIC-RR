const crypto = require('crypto');
const XLSX = require('xlsx');
const { parse: parseCsv } = require('csv-parse/sync');
const initSqlJs = require('sql.js');
const { prisma } = require('../config/database');

const FIELD_PATTERNS = {
  transactionDate: [
    /^(trans(action)?_?)?date$/i, /^order_?date$/i, /^invoice_?date$/i, /^sale_?date$/i,
    /^time(stamp)?$/i, /^date$/i, /^day$/i, /^period$/i, /^billing_?date$/i, /^sold_?on$/i,
    /^created_?at$/i, /^entry_?date$/i, /date/i, /timestamp/i, /day/i
  ],
  productName: [
    /^(product|item)(_?name)?$/i, /^description$/i, /^desc$/i, /^goods$/i, /^particulars?$/i,
    /^sku_?name$/i, /^merchandise$/i, /^service(_?name)?$/i, /^title$/i, /^article$/i,
    /^commodity$/i, /^item_?description$/i, /^product_?title$/i, /^product_?description$/i,
    /^name$/i, /^item_?title$/i, /^inventory_?item$/i, /product/i, /item/i, /merchandise/i, /particular/i, /description/i
  ],
  productSku: [
    /^sku$/i, /^product_?id$/i, /^item_?code$/i, /^barcode$/i, /^upc$/i, /^ean$/i,
    /^code$/i, /^part_?no$/i, /^model(_?no)?$/i, /^serial(_?no)?$/i, /sku/i, /barcode/i
  ],
  quantity: [
    /^(qty|quantity|units?(_?sold)?|volume|count|pieces?|pcs|number_?sold|amount_?sold|quantities|packs?)$/i,
    /^qty$/i, /^quantity$/i, /^units?$/i, /^volume$/i, /^count$/i, /^pieces?$/i, /^pcs$/i,
    /qty/i, /quantity/i, /units?/i, /pieces?/i, /volume/i
  ],
  unitPrice: [
    /^(unit_?)?price$/i, /^selling_?price$/i, /^rate$/i, /^unit_?cost_to_customer$/i,
    /^retail_?price$/i, /^sales?_?price$/i, /^unit_?rate$/i, /^price_?per_?unit$/i,
    /^selling_?rate$/i, /^charge$/i, /^price$/i, /price/i, /rate/i
  ],
  revenue: [
    /^(total(_?amount)?|revenue|sales?(_?amount)?|amount|amt|line_?total|gross_?sales|gross_?amount|grand_?total|net_?sales|net_?amount|subtotal|total_?price|total_?sales|sales?|turnover)$/i,
    /^amount$/i, /^amt$/i, /^total$/i, /^revenue$/i, /^sales$/i, /^gross$/i,
    /revenue/i, /amount/i, /total/i, /gross/i, /sales/i
  ],
  unitCost: [
    /^(unit_?)?cost(_?price)?$/i, /^cost$/i, /^cogs$/i, /^purchase_?price$/i,
    /^buying_?price$/i, /^wholesale_?price$/i, /^cost_?per_?unit$/i, /^expense_?per_?unit$/i,
    /^base_?cost$/i, /cost/i, /cogs/i, /buying/i, /wholesale/i
  ],
  profit: [
    /^(profit|net_?profit|gross_?profit|earnings|margin|gain|markup)$/i,
    /profit/i, /margin/i, /earnings/i
  ],
  categoryName: [
    /^(category(_?name)?|dept|department|group|class|type|section|division|product_?type|genre|sector)$/i,
    /^category$/i, /^dept$/i, /^department$/i, /category/i, /department/i, /division/i, /section/i
  ],
  customerName: [
    /^(customer(_?name)?|client|buyer|patron|account_?name|purchaser|guest)$/i,
    /customer/i, /client/i, /buyer/i
  ],
  invoiceId: [
    /^(invoice(_?no|_?id)?|receipt(_?no)?|trans(action)?_?id|order_?id|ref(erence)?|bill_?no|ticket_?no|doc_?no)$/i,
    /invoice/i, /receipt/i, /order_?id/i, /trans_?id/i, /ref/i
  ],
};

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    // Add 6 hours to counteract evening timezone offsets (e.g. 22:59 UTC -> 04:59 UTC)
    const adjusted = new Date(val.getTime() + 6 * 3600 * 1000);
    let y = adjusted.getUTCFullYear();
    let m = adjusted.getUTCMonth();
    let d = adjusted.getUTCDate();
    if (y >= 20000 && y < 21000) y = 2000 + (y % 100);
    if (y >= 2000 && y <= 2100) return new Date(Date.UTC(y, m, d));
    return null;
  }
  if (typeof val === 'number') {
    // Excel date serial number (30000 to 65000 is ~1982 to ~2078)
    if (val >= 30000 && val <= 65000) {
      try {
        const parsed = XLSX.SSF.parse_date_code(val);
        if (parsed && parsed.y && parsed.m && parsed.d) {
          if (parsed.y >= 2000 && parsed.y <= 2100) {
            return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
          }
        }
      } catch (_) {}
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(excelEpoch.getTime() + val * 86400000);
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        if (y >= 2000 && y <= 2100) return d;
      }
    }
    return null;
  }
  const str = String(val).trim();
  // Match DD/MM/YYYY, MM/DD/YYYY or DD-MM-YYYY (including 2, 4, or 5-digit typo years like 20026)
  const parts = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,5})$/);
  if (parts) {
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    let rawYear = parseInt(parts[3], 10);
    let year = rawYear;
    // Fix human typo with extra zero, e.g. 20026 -> 2026
    if (year >= 20000 && year < 21000) {
      year = 2000 + (year % 100);
    } else if (year < 100) {
      year += 2000;
    }
    if (year >= 2000 && year <= 2100) {
      let day, month;
      if (p1 <= 12 && p2 > 12) {
        // MM/DD/YYYY format (e.g. 9/21/20026 -> month 9, day 21)
        month = p1 - 1;
        day = p2;
      } else {
        // Standard DD/MM/YYYY format (e.g. 21/09/2026 or 01/09/2026)
        day = p1;
        month = p2 - 1;
      }
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        const d = new Date(Date.UTC(year, month, day));
        if (!isNaN(d.getTime())) return d;
      }
    }
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    let y = parsed.getUTCFullYear();
    if (y >= 20000 && y < 21000) {
      parsed.setUTCFullYear(2000 + (y % 100));
      y = parsed.getUTCFullYear();
    }
    if (y >= 2000 && y <= 2100) return parsed;
  }
  return null;
}

function extractDocDate(fileName, rawRows = []) {
  // 1. Check sheet cells in top rows first (actual document content takes precedence)
  for (let r = 0; r < Math.min(12, rawRows.length); r++) {
    const row = rawRows[r] || [];
    for (let c = 0; c < row.length; c++) {
      if (typeof row[c] === 'string' && /date/i.test(row[c].trim())) {
        const d1 = parseDate(row[c + 1]);
        if (d1) return d1;
        if (rawRows[r + 1]) {
          const d2 = parseDate(rawRows[r + 1][c]);
          if (d2) return d2;
        }
      }
    }
  }

  // 2. Fallback to filename (e.g. 01-09-2026 or 2026-09-01)
  if (fileName) {
    const fnMatch1 = fileName.match(/(\d{1,2})[-_.](\d{1,2})[-_.](\d{4})/);
    if (fnMatch1) {
      const day = parseInt(fnMatch1[1], 10);
      const month = parseInt(fnMatch1[2], 10) - 1;
      const year = parseInt(fnMatch1[3], 10);
      if (year >= 2000 && year <= 2100 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        return new Date(Date.UTC(year, month, day));
      }
    }
    const fnMatch2 = fileName.match(/(\d{4})[-_.](\d{1,2})[-_.](\d{1,2})/);
    if (fnMatch2) {
      const year = parseInt(fnMatch2[1], 10);
      const month = parseInt(fnMatch2[2], 10) - 1;
      const day = parseInt(fnMatch2[3], 10);
      if (year >= 2000 && year <= 2100 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        return new Date(Date.UTC(year, month, day));
      }
    }
  }

  return null;
}

function parseExcelSheet(sheet, fileName) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!rawRows || !rawRows.length) return [];
  const docDate = extractDocDate(fileName, rawRows) || new Date();

  // 1. Check if multi-section register (repeated AMT/QTY in sub-header row)
  for (let r = 0; r < Math.min(10, rawRows.length - 1); r++) {
    const row = rawRows[r] || [];
    const nextRow = rawRows[r + 1] || [];
    const amtCount = nextRow.filter((c) => typeof c === 'string' && /^(amt|amount|total)$/i.test(c.trim())).length;
    if (amtCount >= 2) {
      const sections = [];
      let currentSection = null;
      for (let c = 0; c < Math.max(row.length, nextRow.length); c++) {
        const catVal = row[c];
        const subVal = nextRow[c];
        if (catVal && typeof catVal === 'string' && catVal.trim()) {
          const catName = catVal.trim();
          if (!/^(total|grand total|cash|cash at hand|expenses|expences|balance)$/i.test(catName)) {
            currentSection = { category: catName, cols: {} };
            sections.push(currentSection);
          } else {
            currentSection = null;
          }
        }
        if (currentSection && subVal && typeof subVal === 'string') {
          const h = subVal.trim().toUpperCase();
          if (/^DESC/i.test(h)) currentSection.cols.product = c;
          else if (/^QTY/i.test(h)) currentSection.cols.qty = c;
          else if (/^(AMT|AMOUNT|TOTAL)$/i.test(h)) currentSection.cols.amount = c;
          else if (/^PRICE$/i.test(h)) currentSection.cols.price = c;
        }
      }

      const rows = [];
      for (let rIdx = r + 2; rIdx < rawRows.length; rIdx++) {
        const dataRow = rawRows[rIdx] || [];
        for (const sec of sections) {
          const amt = sec.cols.amount !== undefined ? Number(dataRow[sec.cols.amount]) : 0;
          if (amt > 0 && !isNaN(amt)) {
            let prodDesc = sec.cols.product !== undefined ? dataRow[sec.cols.product] : null;
            let prodName = sec.category;
            if (prodDesc && String(prodDesc).trim()) {
              prodName = `${sec.category} - ${String(prodDesc).trim()}`;
            }
            const qty = sec.cols.qty !== undefined && Number(dataRow[sec.cols.qty]) > 0 ? Number(dataRow[sec.cols.qty]) : 1;
            rows.push({
              Date: docDate.toISOString().slice(0, 10),
              Product: prodName,
              Category: sec.category,
              Quantity: qty,
              Amount: amt,
              Price: parseFloat((amt / qty).toFixed(2)),
            });
          }
        }
      }
      if (rows.length > 0) return rows;
    }
  }

  // 2. Standard Tabular Format: Find best header row
  const HEADER_KEYWORDS = [/date/i, /product/i, /item/i, /desc/i, /goods/i, /qty/i, /quantity/i, /price/i, /rate/i, /amount/i, /amt/i, /total/i, /revenue/i, /cost/i, /profit/i, /category/i];
  let bestHeaderRow = 0;
  let maxScore = -1;
  for (let r = 0; r < Math.min(15, rawRows.length); r++) {
    const row = rawRows[r] || [];
    let score = 0;
    for (const cell of row) {
      if (typeof cell === 'string') {
        const cellStr = cell.trim();
        if (HEADER_KEYWORDS.some((rx) => rx.test(cellStr))) {
          score++;
        }
      }
    }
    if (score > maxScore && score >= 1) {
      maxScore = score;
      bestHeaderRow = r;
    }
  }

  const rawObjects = XLSX.utils.sheet_to_json(sheet, { range: bestHeaderRow, defval: null });
  return rawObjects.map((obj) => {
    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k && !k.startsWith('__EMPTY') && v !== null && v !== undefined && String(v).trim() !== '') {
        cleaned[k.trim()] = v;
      }
    }
    const hasRowDate = Object.keys(cleaned).some((k) => /date/i.test(k));
    if (!hasRowDate && docDate) {
      cleaned.Date = docDate.toISOString().slice(0, 10);
    }
    return cleaned;
  }).filter((obj) => Object.keys(obj).length >= 2);
}

class SalesImportService {
  /**
   * Parse uploaded file buffer into an array of plain JS row objects.
   */
  async parseBuffer(fileBuffer, fileName) {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const EXCEL_EXTS = ['xlsx', 'xlsm', 'xlsb', 'xls', 'xltx', 'xltm', 'xlt', 'ods', 'fods', 'xml', 'dif', 'sylk', 'prn'];

    if (EXCEL_EXTS.includes(ext)) {
      const wb = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });
      if (!wb.SheetNames || wb.SheetNames.length === 0) throw new Error('Excel workbook contains no sheets.');

      // Inspect all sheets and select the sheet with the highest number of parsed sales rows
      let bestSheetName = wb.SheetNames[0];
      let bestRows = [];

      for (const name of wb.SheetNames) {
        const sheet = wb.Sheets[name];
        if (!sheet) continue;
        const parsed = parseExcelSheet(sheet, fileName);
        if (parsed.length > bestRows.length) {
          bestRows = parsed;
          bestSheetName = name;
        }
      }

      if (bestRows.length === 0) {
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        bestRows = parseExcelSheet(firstSheet, fileName);
      }

      return { format: ext.toUpperCase(), rows: bestRows };
    }

    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const text = fileBuffer.toString('utf8');
      const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semiCount = (firstLine.match(/;/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;
      const pipeCount = (firstLine.match(/\|/g) || []).length;

      let delimiter = ',';
      if (semiCount > commaCount && semiCount >= tabCount) delimiter = ';';
      else if (tabCount > commaCount && tabCount >= semiCount) delimiter = '\t';
      else if (pipeCount > commaCount && pipeCount >= semiCount) delimiter = '|';

      const rows = parseCsv(text, {
        delimiter,
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
      return { format: 'CSV', rows };
    }

    if (ext === 'sqlite' || ext === 'db' || ext === 'sqlite3') {
      const SQL = await initSqlJs();
      const db = new SQL.Database(fileBuffer);
      const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%'");
      if (!tablesRes.length || !tablesRes[0].values.length) {
        throw new Error('SQLite database contains no user tables.');
      }
      const tableNames = tablesRes[0].values.map((v) => v[0]);

      let bestTable = tableNames[0];
      let bestTableScore = -1;

      for (const tbl of tableNames) {
        let score = 0;
        if (/sale|order|trans|invoice|pos|item|receipt|record/i.test(tbl)) score += 5;
        try {
          const colInfo = db.exec(`PRAGMA table_info("${tbl}")`);
          if (colInfo.length && colInfo[0].values) {
            const colNames = colInfo[0].values.map((v) => String(v[1]).toLowerCase());
            if (colNames.some((c) => /date|time/i.test(c))) score += 2;
            if (colNames.some((c) => /product|item|desc|name/i.test(c))) score += 2;
            if (colNames.some((c) => /amount|price|total|revenue|cost/i.test(c))) score += 3;
          }
        } catch (_) {}
        if (score > bestTableScore) {
          bestTableScore = score;
          bestTable = tbl;
        }
      }

      const dataRes = db.exec(`SELECT * FROM "${bestTable}" LIMIT 50000`);
      if (!dataRes.length) return { format: 'SQLITE', rows: [] };
      const columns = dataRes[0].columns;
      const rows = dataRes[0].values.map((valArr) => {
        const row = {};
        columns.forEach((col, idx) => {
          row[col] = valArr[idx];
        });
        return row;
      });
      return { format: 'SQLITE', rows };
    }

    if (ext === 'json') {
      const text = fileBuffer.toString('utf8');
      const data = JSON.parse(text);
      let rows = [];
      if (Array.isArray(data)) {
        rows = data;
      } else if (data && typeof data === 'object') {
        const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
        if (arrayKey) {
          rows = data[arrayKey];
        } else {
          for (const subKey of Object.keys(data)) {
            if (data[subKey] && typeof data[subKey] === 'object') {
              const nestedArrKey = Object.keys(data[subKey]).find((k) => Array.isArray(data[subKey][k]));
              if (nestedArrKey) {
                rows = data[subKey][nestedArrKey];
                break;
              }
            }
          }
        }
      }
      return { format: 'JSON', rows };
    }

    // Dynamic Fallback: Try XLSX parser
    try {
      const wb = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
      if (wb && wb.SheetNames && wb.SheetNames.length > 0) {
        let bestRows = [];
        for (const name of wb.SheetNames) {
          const sheet = wb.Sheets[name];
          if (!sheet) continue;
          const parsed = parseExcelSheet(sheet, fileName);
          if (parsed.length > bestRows.length) bestRows = parsed;
        }
        if (bestRows.length > 0) {
          return { format: 'EXCEL', rows: bestRows };
        }
      }
    } catch (_) {}

    throw new Error(`Unsupported file format. Please upload an Excel (.xlsx, .xlsm, .xls), CSV, SQLite (.db), or JSON file.`);
  }

  /**
   * Intelligently detect column mappings from row headers.
   */
  detectColumns(rows) {
    if (!rows || rows.length === 0) return { mapping: {}, confidence: 0 };
    const sample = rows[0];
    const headers = Object.keys(sample);
    const mapping = {};

    for (const [targetField, regexList] of Object.entries(FIELD_PATTERNS)) {
      for (const regex of regexList) {
        const found = headers.find((h) => {
          if (!h) return false;
          if (regex.test(h.trim())) return true;
          // Normalized header: strip currencies ($ ₦ € £), parentheses, punctuation
          const normalized = h.toLowerCase().replace(/[\$₦€£\(\)\[\]_.:\-\/]/g, ' ').replace(/\s+/g, ' ').trim();
          return regex.test(normalized);
        });
        if (found && !Object.values(mapping).includes(found)) {
          mapping[targetField] = found;
          break;
        }
      }
    }

    // Required fields check
    const hasDate = Boolean(mapping.transactionDate);
    const hasProduct = Boolean(mapping.productName);
    const hasRevenueOrPrice = Boolean(mapping.revenue || (mapping.unitPrice && mapping.quantity));

    let confidence = 0.5;
    if (hasDate) confidence += 0.2;
    if (hasProduct) confidence += 0.2;
    if (hasRevenueOrPrice) confidence += 0.1;

    return { mapping, headers, confidence: Math.min(1.0, confidence) };
  }

  /**
   * Preview parsed data and suggested column mapping before committing.
   */
  async preview(fileBuffer, fileName, customMapping = null) {
    const { format, rows } = await this.parseBuffer(fileBuffer, fileName);
    const { mapping: autoMapping, headers, confidence } = this.detectColumns(rows);
    const activeMapping = customMapping && Object.keys(customMapping).length > 0 ? customMapping : autoMapping;

    const samplePreview = rows.slice(0, 10).map((r) => {
      const normalized = {};
      for (const [target, source] of Object.entries(activeMapping)) {
        if (source && r[source] !== undefined) {
          normalized[target] = r[source];
        }
      }
      return { raw: r, normalized };
    });

    return {
      fileName,
      format,
      totalRows: rows.length,
      headers,
      detectedMapping: activeMapping,
      confidence,
      hasCostData: Boolean(activeMapping.unitCost || activeMapping.profit),
      sampleRows: samplePreview,
    };
  }

  /**
   * Import, validate, normalize, deduplicate, and persist sales transactions.
   */
  async importData({ orgId, userId, fileBuffer, fileName, columnMapping = null }) {
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const { format, rows } = await this.parseBuffer(fileBuffer, fileName);
    if (!rows.length) throw new Error('Uploaded file contains no rows.');

    const { mapping: autoMapping } = this.detectColumns(rows);
    const mapping = columnMapping && Object.keys(columnMapping).length > 0 ? columnMapping : autoMapping;

    const fallbackDocDate = extractDocDate(fileName, rows) || new Date();

    const dateCol = mapping.transactionDate || mapping.date || Object.keys(rows[0] || {}).find((k) => /date|day/i.test(k));
    const prodCol = mapping.productName || mapping.product || Object.keys(rows[0] || {}).find((k) => /product|item|desc|goods|particular/i.test(k));
    const skuCol = mapping.productSku || mapping.sku;
    const qtyCol = mapping.quantity || mapping.qty || Object.keys(rows[0] || {}).find((k) => /qty|quantity|units?|pieces?|pcs/i.test(k));
    const priceCol = mapping.unitPrice || mapping.price || Object.keys(rows[0] || {}).find((k) => /price|rate/i.test(k));
    const revCol = mapping.revenue || mapping.amount || mapping.total || Object.keys(rows[0] || {}).find((k) => /amount|amt|revenue|total/i.test(k));
    const costCol = mapping.unitCost || mapping.cost || Object.keys(rows[0] || {}).find((k) => /cost|cogs/i.test(k));
    const profitCol = mapping.profit || Object.keys(rows[0] || {}).find((k) => /profit|margin/i.test(k));
    const catCol = mapping.categoryName || mapping.category || Object.keys(rows[0] || {}).find((k) => /category|dept|section/i.test(k));
    const custCol = mapping.customerName || mapping.customer;
    const invCol = mapping.invoiceId || mapping.invoice;

    if (!revCol && !priceCol) {
      throw new Error("We couldn't find a sales amount or price column in this file. Please make sure your sales records include amounts paid or unit prices.");
    }

    const validTransactions = [];
    const invalidRows = [];
    const affectedPeriods = new Set(); // Set of "YYYY-MM"

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawDate = dateCol ? row[dateCol] : null;
      let parsedDate = rawDate ? parseDate(rawDate) : null;
      if (!parsedDate) {
        parsedDate = fallbackDocDate;
      }

      const rawProduct = prodCol ? row[prodCol] : null;
      const rawCategory = catCol ? row[catCol] : null;
      let productName = rawProduct && String(rawProduct).trim() ? String(rawProduct).trim() : null;
      if (!productName && rawCategory && String(rawCategory).trim()) {
        productName = String(rawCategory).trim();
      }
      if (!productName) {
        productName = 'Sales Record';
      }

      const rawQty = qtyCol ? row[qtyCol] : null;
      const quantity = Math.max(0.001, typeof rawQty === 'number' ? rawQty : parseFloat(String(rawQty).replace(/[^0-9.-]/g, '')) || 1);

      let unitPrice = 0;
      if (priceCol && row[priceCol] !== undefined && row[priceCol] !== null) {
        unitPrice = typeof row[priceCol] === 'number' ? row[priceCol] : parseFloat(String(row[priceCol]).replace(/[^0-9.-]/g, '')) || 0;
      }

      let revenue = 0;
      if (revCol && row[revCol] !== undefined && row[revCol] !== null) {
        revenue = typeof row[revCol] === 'number' ? row[revCol] : parseFloat(String(row[revCol]).replace(/[^0-9.-]/g, '')) || 0;
      } else {
        revenue = parseFloat((unitPrice * quantity).toFixed(2));
      }

      if (revenue <= 0 && unitPrice <= 0) {
        invalidRows.push({ rowNumber: i + 1, reason: 'Zero sales amount' });
        continue;
      }

      if (unitPrice === 0 && revenue > 0 && quantity > 0) {
        unitPrice = parseFloat((revenue / quantity).toFixed(2));
      }

      let unitCost = null;
      let totalCost = null;
      if (costCol && row[costCol] !== undefined && row[costCol] !== null) {
        const c = typeof row[costCol] === 'number' ? row[costCol] : parseFloat(String(row[costCol]).replace(/[^0-9.-]/g, ''));
        if (!isNaN(c) && c >= 0) {
          unitCost = c;
          totalCost = parseFloat((c * quantity).toFixed(2));
        }
      }

      let profit = null;
      let profitMargin = null;
      if (profitCol && row[profitCol] !== undefined && row[profitCol] !== null) {
        const p = typeof row[profitCol] === 'number' ? row[profitCol] : parseFloat(String(row[profitCol]).replace(/[^0-9.-]/g, ''));
        if (!isNaN(p)) profit = p;
      } else if (totalCost !== null) {
        profit = parseFloat((revenue - totalCost).toFixed(2));
      }

      if (profit !== null && revenue > 0) {
        profitMargin = parseFloat(((profit / revenue) * 100).toFixed(2));
      }

      const invoiceId = invCol && row[invCol] ? String(row[invCol]).trim() : null;
      const productSku = skuCol && row[skuCol] ? String(row[skuCol]).trim() : null;
      const categoryName = catCol && row[catCol] ? String(row[catCol]).trim() : null;
      const customerName = custCol && row[custCol] ? String(row[custCol]).trim() : null;

      const year = parsedDate.getUTCFullYear();
      const month = parsedDate.getUTCMonth() + 1;
      const day = parsedDate.getUTCDate();
      affectedPeriods.add(`${year}-${String(month).padStart(2, '0')}`);

      // Transaction-level deterministic dedupe hash
      const dedupeRaw = [
        orgId,
        invoiceId || '',
        parsedDate.toISOString().slice(0, 10),
        productName.toLowerCase(),
        quantity.toFixed(3),
        revenue.toFixed(2),
      ].join('::');
      const dedupeHash = crypto.createHash('sha256').update(dedupeRaw).digest('hex');

      validTransactions.push({
        orgId,
        transactionDate: parsedDate,
        year,
        month,
        day,
        invoiceId,
        productName,
        productSku,
        categoryName,
        quantity,
        unitPrice,
        revenue,
        unitCost,
        totalCost,
        profit,
        profitMargin,
        customerName,
        dedupeHash,
      });
    }

    if (validTransactions.length === 0) {
      throw new Error(`No valid sales transactions could be imported. ${invalidRows.length} rows failed validation.`);
    }

    // Determine detected primary period label (e.g. "January 2026")
    const periodMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const periodsArr = Array.from(affectedPeriods);
    let detectedPeriod = 'Historical Sales';
    if (periodsArr.length === 1) {
      const [y, m] = periodsArr[0].split('-').map(Number);
      detectedPeriod = `${periodMonthNames[m - 1]} ${y}`;
    } else if (periodsArr.length > 1) {
      detectedPeriod = `${periodsArr.length} Months (${periodsArr[0]} to ${periodsArr[periodsArr.length - 1]})`;
    }

    // Create the batch import record
    const batch = await prisma.salesBatchImport.create({
      data: {
        orgId,
        fileName,
        fileFormat: format,
        fileHash,
        totalRows: rows.length,
        importedRows: 0,
        skippedRows: 0,
        detectedPeriod,
        uploadedById: userId,
        metadata: {
          columnMapping: mapping,
          invalidRowsCount: invalidRows.length,
          sampleValidationIssues: invalidRows.slice(0, 5),
          periods: periodsArr,
        },
      },
    });

    // Efficient bulk deduplication & insert
    const dedupeHashes = validTransactions.map((t) => t.dedupeHash);
    const existingRecords = await prisma.salesTransaction.findMany({
      where: { dedupeHash: { in: dedupeHashes } },
      select: { dedupeHash: true },
    });
    const existingHashSet = new Set(existingRecords.map((r) => r.dedupeHash));
    const newTransactions = validTransactions.filter((t) => !existingHashSet.has(t.dedupeHash));
    const skippedCount = validTransactions.length - newTransactions.length;
    let importedCount = 0;

    if (newTransactions.length > 0) {
      const chunkSize = 250;
      for (let c = 0; c < newTransactions.length; c += chunkSize) {
        const chunk = newTransactions.slice(c, c + chunkSize);
        await prisma.salesTransaction.createMany({
          data: chunk.map((t) => ({ ...t, importBatchId: batch.id })),
          skipDuplicates: true,
        });
      }
      importedCount = newTransactions.length;
    }

    // Update batch counts
    await prisma.salesBatchImport.update({
      where: { id: batch.id },
      data: {
        importedRows: importedCount,
        skippedRows: skippedCount + invalidRows.length,
      },
    });

    // Recalculate SalesMonthlySummary for all affected months
    for (const period of affectedPeriods) {
      const [year, month] = period.split('-').map(Number);
      await this.recalculateMonthlySummary(orgId, year, month);
    }

    const batchTotalRevenue = validTransactions.reduce((acc, t) => acc + (t.revenue || 0), 0);

    return {
      batchId: batch.id,
      fileName,
      totalRows: rows.length,
      importedRows: importedCount,
      skippedRows: skippedCount,
      invalidRowsCount: invalidRows.length,
      totalRevenue: parseFloat(batchTotalRevenue.toFixed(2)),
      hasCostData: Boolean(costCol || profitCol),
      detectedPeriod,
      affectedMonths: Array.from(affectedPeriods),
    };
  }

  /**
   * Recalculates and updates the SalesMonthlySummary for a specific month.
   */
  async recalculateMonthlySummary(orgId, year, month) {
    const transactions = await prisma.salesTransaction.findMany({
      where: { orgId, year, month },
      select: {
        revenue: true,
        totalCost: true,
        profit: true,
        quantity: true,
        productName: true,
      },
    });

    if (transactions.length === 0) {
      await prisma.salesMonthlySummary.deleteMany({
        where: { orgId, year, month },
      });
      return null;
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalUnitsSold = 0;
    let hasCostData = false;
    const uniqueProducts = new Set();

    for (const t of transactions) {
      totalRevenue += t.revenue;
      totalUnitsSold += t.quantity;
      uniqueProducts.add(t.productName.toLowerCase());
      if (t.totalCost !== null && t.totalCost !== undefined) {
        totalCost += t.totalCost;
        hasCostData = true;
      }
      if (t.profit !== null && t.profit !== undefined) {
        totalProfit += t.profit;
      }
    }

    totalRevenue = parseFloat(totalRevenue.toFixed(2));
    totalCost = parseFloat(totalCost.toFixed(2));
    totalProfit = parseFloat(totalProfit.toFixed(2));
    totalUnitsSold = parseFloat(totalUnitsSold.toFixed(2));
    const profitMargin = totalRevenue > 0 && hasCostData ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2)) : null;
    const totalTransactions = transactions.length;
    const averageOrderValue = totalTransactions > 0 ? parseFloat((totalRevenue / totalTransactions).toFixed(2)) : 0;

    return prisma.salesMonthlySummary.upsert({
      where: { orgId_year_month: { orgId, year, month } },
      create: {
        orgId,
        year,
        month,
        totalRevenue,
        totalCost: hasCostData ? totalCost : null,
        totalProfit: hasCostData ? totalProfit : null,
        profitMargin,
        totalUnitsSold,
        uniqueProducts: uniqueProducts.size,
        totalTransactions,
        averageOrderValue,
        hasCostData,
      },
      update: {
        totalRevenue,
        totalCost: hasCostData ? totalCost : null,
        totalProfit: hasCostData ? totalProfit : null,
        profitMargin,
        totalUnitsSold,
        uniqueProducts: uniqueProducts.size,
        totalTransactions,
        averageOrderValue,
        hasCostData,
      },
    });
  }
}

module.exports = new SalesImportService();
