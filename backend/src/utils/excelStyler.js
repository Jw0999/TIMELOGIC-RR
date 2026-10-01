/**
 * TimeLogic Modern Box-Fitted Excel Styler
 * Provides professional SaaS enterprise formatting, typography, borders,
 * status badge fills, and responsive column fitting using ExcelJS.
 */

const PALETTE = {
  PRIMARY: 'FF1E293B',       // Deep Slate / Navy
  PRIMARY_LIGHT: 'FF334155', // Slate 700
  ACCENT: 'FF2563EB',        // TimeLogic Blue
  ACCENT_LIGHT: 'FFEFF6FF',  // Blue 50
  CARD_BG: 'FFF8FAFC',       // Slate 50
  BORDER: 'FFCBD5E1',        // Slate 300
  BORDER_LIGHT: 'FFE2E8F0',  // Slate 200
  TEXT_MAIN: 'FF0F172A',     // Slate 900
  TEXT_MUTED: 'FF64748B',    // Slate 500
  WHITE: 'FFFFFFFF',

  // Status badges (Restrained pastel fills & dark readable text)
  STATUS: {
    PRESENT:         { bg: 'FFDCFCE7', text: 'FF166534' }, // Soft green
    LATE:            { bg: 'FFFEF3C7', text: 'FF92400E' }, // Soft amber
    COMPLETELY_LATE: { bg: 'FFFFEDD5', text: 'FF9A3412' }, // Soft orange
    ABSENT:          { bg: 'FFFEE2E2', text: 'FF991B1B' }, // Soft red
    ON_LEAVE:        { bg: 'FFEDE9FE', text: 'FF5B21B6' }, // Soft purple
    HALF_DAY:        { bg: 'FFE0F2FE', text: 'FF0369A1' }, // Soft cyan
    REVIEW_REQUIRED: { bg: 'FFF3E8FF', text: 'FF6B21A8' }, // Soft violet
    FLAGGED:         { bg: 'FFFEE2E2', text: 'FFB91C1C' }, // Soft red
    RESOLVED:        { bg: 'FFDCFCE7', text: 'FF166534' },
    ACTIVE:          { bg: 'FFDCFCE7', text: 'FF166534' },
    TERMINATED:      { bg: 'FFFEE2E2', text: 'FF991B1B' },
  },
};

const BORDER_THIN = {
  top: { style: 'thin', color: { argb: PALETTE.BORDER_LIGHT } },
  left: { style: 'thin', color: { argb: PALETTE.BORDER_LIGHT } },
  bottom: { style: 'thin', color: { argb: PALETTE.BORDER_LIGHT } },
  right: { style: 'thin', color: { argb: PALETTE.BORDER_LIGHT } },
};

const BORDER_MEDIUM = {
  top: { style: 'medium', color: { argb: PALETTE.PRIMARY } },
  left: { style: 'medium', color: { argb: PALETTE.PRIMARY } },
  bottom: { style: 'medium', color: { argb: PALETTE.PRIMARY } },
  right: { style: 'medium', color: { argb: PALETTE.PRIMARY } },
};

function sanitizeSheetName(name, usedNames = new Set()) {
  let clean = String(name || 'Organization')
    .replace(/[\\\/\?\*\[\]\:]/g, ' ')
    .trim()
    .replace(/^'+|'+$/g, '')
    .slice(0, 31)
    .trim() || 'Organization';

  let uniqueName = clean;
  let counter = 1;
  while (usedNames.has(uniqueName.toLowerCase())) {
    const suffix = ` (${counter})`;
    uniqueName = clean.slice(0, 31 - suffix.length) + suffix;
    counter++;
  }
  usedNames.add(uniqueName.toLowerCase());
  return uniqueName;
}

/**
 * Creates an executive branded top banner with Organization / Report context
 */
function renderHeaderBanner(worksheet, { title, organizationName, period, generatedAt, totalCols = 10 }) {
  // Row 1: Main Title
  const r1 = worksheet.addRow([title]);
  worksheet.mergeCells(1, 1, 1, totalCols);
  r1.height = 30;
  const c1 = r1.getCell(1);
  c1.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: PALETTE.WHITE } };
  c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.PRIMARY } };
  c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Row 2: Subtitle info
  const subtitle = `Organization: ${organizationName || 'All Organizations'}  |  Period: ${period || 'Full Database History'}  |  Generated: ${generatedAt}`;
  const r2 = worksheet.addRow([subtitle]);
  worksheet.mergeCells(2, 1, 2, totalCols);
  r2.height = 20;
  const c2 = r2.getCell(1);
  c2.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FFCBD5E1' } };
  c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.PRIMARY_LIGHT } };
  c2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Spacer row
  const spacer = worksheet.addRow([]);
  spacer.height = 10;
}

/**
 * Renders an executive KPI Card Grid (2 rows: labels on top, bold numbers on bottom)
 */
function renderKpiCards(worksheet, cards = [], totalCols = 10) {
  if (!cards.length) return;

  const cardCount = cards.length;
  const colsPerCard = Math.max(1, Math.floor(totalCols / cardCount));

  // Label row
  const labelRow = worksheet.addRow([]);
  labelRow.height = 18;

  // Value row
  const valueRow = worksheet.addRow([]);
  valueRow.height = 28;

  cards.forEach((card, idx) => {
    const startCol = idx * colsPerCard + 1;
    const endCol = idx === cardCount - 1 ? totalCols : startCol + colsPerCard - 1;

    labelRow.getCell(startCol).value = card.label.toUpperCase();
    labelRow.getCell(startCol).font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: PALETTE.TEXT_MUTED } };
    labelRow.getCell(startCol).alignment = { vertical: 'bottom', horizontal: 'center' };

    valueRow.getCell(startCol).value = card.value;
    valueRow.getCell(startCol).font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: card.color || PALETTE.PRIMARY } };
    valueRow.getCell(startCol).alignment = { vertical: 'middle', horizontal: 'center' };
    if (card.numFmt) valueRow.getCell(startCol).numFmt = card.numFmt;

    if (endCol > startCol) {
      worksheet.mergeCells(labelRow.number, startCol, labelRow.number, endCol);
      worksheet.mergeCells(valueRow.number, startCol, valueRow.number, endCol);
    }

    // Apply card border & background
    for (let r = labelRow.number; r <= valueRow.number; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = worksheet.getCell(r, c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.CARD_BG } };
        cell.border = {
          top: r === labelRow.number ? { style: 'thin', color: { argb: PALETTE.BORDER } } : undefined,
          bottom: r === valueRow.number ? { style: 'thin', color: { argb: PALETTE.BORDER } } : undefined,
          left: c === startCol ? { style: 'thin', color: { argb: PALETTE.BORDER } } : undefined,
          right: c === endCol ? { style: 'thin', color: { argb: PALETTE.BORDER } } : undefined,
        };
      }
    }
  });

  const spacer = worksheet.addRow([]);
  spacer.height = 12;
}

/**
 * Renders a Section Header (e.g. "ATTENDANCE RECORDS", "PENALTIES LEDGER")
 */
function renderSectionHeader(worksheet, sectionTitle, totalCols = 10) {
  const row = worksheet.addRow([sectionTitle]);
  worksheet.mergeCells(row.number, 1, row.number, totalCols);
  row.height = 24;
  const cell = row.getCell(1);
  cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: PALETTE.PRIMARY } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.CARD_BG } };
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  cell.border = {
    top: { style: 'thin', color: { argb: PALETTE.BORDER } },
    bottom: { style: 'thin', color: { argb: PALETTE.BORDER } },
    left: { style: 'thin', color: { argb: PALETTE.BORDER } },
    right: { style: 'thin', color: { argb: PALETTE.BORDER } },
  };
}

/**
 * Renders a stylized table header row
 */
function renderTableHeader(worksheet, headers = []) {
  const row = worksheet.addRow(headers);
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: PALETTE.WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.PRIMARY_LIGHT } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER_THIN;
  });
  return row;
}

/**
 * Formats a table data row with clean typography, borders, and status highlighting
 */
function formatDataRow(row, isEven = false, statusColIndex = null) {
  row.height = 20;
  const defaultFill = isEven ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } } : null;

  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { name: 'Segoe UI', size: 9, color: { argb: PALETTE.TEXT_MAIN } };
    cell.border = BORDER_THIN;
    if (defaultFill) cell.fill = defaultFill;

    const val = cell.value;
    const strVal = String(val ?? '').trim().toUpperCase();

    // Smart alignment
    if (typeof val === 'number') {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(strVal) || /^\d{2}:\d{2}(:\d{2})?$/.test(strVal)) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (['YES', 'NO', 'ACTIVE', 'ENDED', 'LOW', 'MEDIUM', 'HIGH'].includes(strVal)) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }

    // Status Badge highlighting
    if (colNumber === statusColIndex || PALETTE.STATUS[strVal]) {
      const badge = PALETTE.STATUS[strVal];
      if (badge) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: badge.bg } };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: badge.text } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    }
  });
}

/**
 * Computes optimal column widths based on cell text lengths with strict boundaries
 */
function autoFitColumns(worksheet, minWidth = 12, maxWidth = 42) {
  worksheet.columns.forEach((column) => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: false }, (cell) => {
      // Ignore merged banner rows
      if (cell.row <= 3) return;
      const text = cell.value ? String(cell.value) : '';
      if (text.length > maxLen) maxLen = text.length;
    });
    column.width = Math.min(Math.max(maxLen + 4, minWidth), maxWidth);
  });
}

/**
 * Configures professional print and sheet views
 */
function applySheetSetup(worksheet, { freezeY = 5, landscape = true } = {}) {
  if (freezeY > 0) {
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: freezeY, activeCell: `A${freezeY + 1}` },
    ];
  }

  worksheet.pageSetup = {
    orientation: landscape ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9, // A4
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
  };
}

module.exports = {
  PALETTE,
  BORDER_THIN,
  BORDER_MEDIUM,
  sanitizeSheetName,
  renderHeaderBanner,
  renderKpiCards,
  renderSectionHeader,
  renderTableHeader,
  formatDataRow,
  autoFitColumns,
  applySheetSetup,
};
