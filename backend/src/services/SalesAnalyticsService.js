const { prisma } = require('../config/database');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

class SalesAnalyticsService {
  /**
   * Retrieves all available years and months with sales data for this organization.
   */
  async getAvailablePeriods(orgId) {
    const summaries = await prisma.salesMonthlySummary.findMany({
      where: { orgId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      select: {
        year: true,
        month: true,
        totalRevenue: true,
        totalTransactions: true,
        totalUnitsSold: true,
        hasCostData: true,
      },
    });

    const yearsSet = new Set(summaries.map((s) => s.year));
    const years = Array.from(yearsSet).sort((a, b) => b - a);

    const formattedMonths = summaries.map((s) => ({
      year: s.year,
      month: s.month,
      monthName: MONTH_NAMES[s.month - 1] || `Month ${s.month}`,
      label: `${MONTH_NAMES[s.month - 1] || `Month ${s.month}`} ${s.year}`,
      totalRevenue: s.totalRevenue,
      totalTransactions: s.totalTransactions,
      hasCostData: s.hasCostData,
    }));

    return {
      years,
      months: formattedMonths,
      hasData: summaries.length > 0,
      latestPeriod: formattedMonths[0] || null,
    };
  }

  /**
   * Computes comprehensive sales intelligence analytics for an organization.
   */
  async getDashboardAnalytics(orgId, { year, month } = {}) {
    // 1. Resolve active period
    const periods = await this.getAvailablePeriods(orgId);
    if (!periods.hasData) {
      return {
        hasData: false,
        kpis: {
          totalRevenue: 0,
          totalProfit: null,
          profitMargin: null,
          totalUnitsSold: 0,
          uniqueProducts: 0,
          totalTransactions: 0,
          averageOrderValue: 0,
          hasCostData: false,
        },
        topProducts: [],
        dailyTrend: [],
        monthlyComparison: [],
        categoryPerformance: [],
        businessInsights: [],
        alerts: [],
      };
    }

    const isAllTime = year === 'all' || year === 'ALL' || month === 'all';
    const activeYear = isAllTime ? null : (parseInt(year, 10) || periods.latestPeriod.year);
    const activeMonth = isAllTime ? null : (month ? parseInt(month, 10) : periods.latestPeriod.month);

    const where = { orgId };
    if (!isAllTime) {
      if (activeYear) where.year = activeYear;
      if (activeMonth) where.month = activeMonth;
    }

    // 2. Fetch all matching transactions
    const transactions = await prisma.salesTransaction.findMany({
      where,
      orderBy: { transactionDate: 'asc' },
    });

    if (transactions.length === 0) {
      return {
        hasData: false,
        period: { isAllTime, year: activeYear, month: activeMonth },
        kpis: { totalRevenue: 0, totalUnitsSold: 0, totalTransactions: 0, hasCostData: false },
        topProducts: [],
        dailyTrend: [],
        monthlyComparison: [],
        categoryPerformance: [],
        businessInsights: [],
        alerts: [],
      };
    }

    // 3. Compute KPI metrics
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalUnitsSold = 0;
    let hasCostData = false;
    const productsMap = new Map();
    const categoriesMap = new Map();
    const dailyMap = new Map();

    for (const t of transactions) {
      totalRevenue += t.revenue;
      totalUnitsSold += t.quantity;

      if (t.totalCost !== null && t.totalCost !== undefined) {
        totalCost += t.totalCost;
        hasCostData = true;
      }
      if (t.profit !== null && t.profit !== undefined) {
        totalProfit += t.profit;
      }

      // Group by Product
      const pKey = t.productName;
      if (!productsMap.has(pKey)) {
        productsMap.set(pKey, {
          name: t.productName,
          sku: t.productSku || null,
          category: t.categoryName || 'Uncategorized',
          unitsSold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          transactions: 0,
          hasCost: false,
        });
      }
      const p = productsMap.get(pKey);
      p.unitsSold += t.quantity;
      p.revenue += t.revenue;
      p.transactions += 1;
      if (t.totalCost !== null) {
        p.cost += t.totalCost;
        p.hasCost = true;
      }
      if (t.profit !== null) {
        p.profit += t.profit;
      }

      // Group by Category
      if (t.categoryName && t.categoryName.trim()) {
        const cKey = t.categoryName.trim();
        if (!categoriesMap.has(cKey)) {
          categoriesMap.set(cKey, { category: cKey, revenue: 0, unitsSold: 0, transactions: 0 });
        }
        const c = categoriesMap.get(cKey);
        c.revenue += t.revenue;
        c.unitsSold += t.quantity;
        c.transactions += 1;
      }

      // Group by Day (for daily trend)
      const dayKey = t.transactionDate.toISOString().slice(0, 10);
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { date: dayKey, day: t.day, revenue: 0, unitsSold: 0, profit: 0, transactions: 0 });
      }
      const d = dailyMap.get(dayKey);
      d.revenue += t.revenue;
      d.unitsSold += t.quantity;
      if (t.profit !== null) d.profit += t.profit;
      d.transactions += 1;
    }

    totalRevenue = parseFloat(totalRevenue.toFixed(2));
    totalCost = parseFloat(totalCost.toFixed(2));
    totalProfit = parseFloat(totalProfit.toFixed(2));
    totalUnitsSold = parseFloat(totalUnitsSold.toFixed(2));
    const profitMargin = totalRevenue > 0 && hasCostData ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2)) : null;
    const totalTransactions = transactions.length;
    const averageOrderValue = totalTransactions > 0 ? parseFloat((totalRevenue / totalTransactions).toFixed(2)) : 0;
    const uniqueProductsCount = productsMap.size;

    // 4. Products Ranking & Performance
    const productList = Array.from(productsMap.values()).map((p) => {
      const shareOfRevenue = totalRevenue > 0 ? parseFloat(((p.revenue / totalRevenue) * 100).toFixed(2)) : 0;
      const margin = p.revenue > 0 && p.hasCost ? parseFloat(((p.profit / p.revenue) * 100).toFixed(2)) : null;
      return {
        ...p,
        revenue: parseFloat(p.revenue.toFixed(2)),
        profit: p.hasCost ? parseFloat(p.profit.toFixed(2)) : null,
        unitsSold: parseFloat(p.unitsSold.toFixed(2)),
        avgSellingPrice: p.unitsSold > 0 ? parseFloat((p.revenue / p.unitsSold).toFixed(2)) : 0,
        margin,
        shareOfRevenue,
      };
    });

    const topByRevenue = [...productList].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const topByUnits = [...productList].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10);
    const topByProfit = hasCostData
      ? [...productList].filter((p) => p.profit !== null).sort((a, b) => (b.profit || 0) - (a.profit || 0)).slice(0, 10)
      : [];
    const highestMarginProducts = hasCostData
      ? [...productList].filter((p) => p.margin !== null && p.unitsSold >= 2).sort((a, b) => (b.margin || 0) - (a.margin || 0)).slice(0, 5)
      : [];

    // 5. Daily Trend Analysis
    const dailyTrend = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        revenue: parseFloat(d.revenue.toFixed(2)),
        profit: hasCostData ? parseFloat(d.profit.toFixed(2)) : null,
        unitsSold: parseFloat(d.unitsSold.toFixed(2)),
      }));

    let bestDay = null;
    let worstDay = null;
    if (dailyTrend.length > 0) {
      bestDay = dailyTrend.reduce((max, d) => (d.revenue > max.revenue ? d : max), dailyTrend[0]);
      worstDay = dailyTrend.reduce((min, d) => (d.revenue < min.revenue ? d : min), dailyTrend[0]);
    }

    // 6. Monthly Comparison (MoM & Historical)
    const allSummaries = await prisma.salesMonthlySummary.findMany({
      where: { orgId, ...(activeYear ? { year: activeYear } : {}) },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    const monthlyComparison = allSummaries.map((s, idx) => {
      const prev = idx > 0 ? allSummaries[idx - 1] : null;
      let revenueGrowth = null;
      if (prev && prev.totalRevenue > 0) {
        revenueGrowth = parseFloat((((s.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100).toFixed(2));
      }
      return {
        year: s.year,
        month: s.month,
        monthName: MONTH_NAMES[s.month - 1] || `M${s.month}`,
        label: `${MONTH_NAMES[s.month - 1]} ${s.year}`,
        totalRevenue: s.totalRevenue,
        totalProfit: s.totalProfit,
        profitMargin: s.profitMargin,
        totalUnitsSold: s.totalUnitsSold,
        totalTransactions: s.totalTransactions,
        revenueGrowth,
      };
    });

    // 7. Category Performance
    const categoryPerformance = Array.from(categoriesMap.values())
      .map((c) => ({
        ...c,
        revenue: parseFloat(c.revenue.toFixed(2)),
        unitsSold: parseFloat(c.unitsSold.toFixed(2)),
        shareOfRevenue: totalRevenue > 0 ? parseFloat(((c.revenue / totalRevenue) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 8. Deterministic Business Insights Generation
    const businessInsights = [];
    const alerts = [];

    // Revenue concentration insight
    if (topByRevenue.length > 0) {
      const top5Rev = topByRevenue.slice(0, 5).reduce((sum, p) => sum + p.revenue, 0);
      const top5Pct = totalRevenue > 0 ? Math.round((top5Rev / totalRevenue) * 100) : 0;
      businessInsights.push({
        id: 'rev-concentration',
        type: 'STRENGTH',
        title: 'Top Product Contribution',
        text: `Top ${Math.min(5, topByRevenue.length)} products generated ${top5Pct}% of total revenue (₦${top5Rev.toLocaleString()}).`,
      });

      businessInsights.push({
        id: 'best-seller',
        type: 'HIGHLIGHT',
        title: 'Star Performer',
        text: `${topByRevenue[0].name} is the top revenue generator with ₦${topByRevenue[0].revenue.toLocaleString()} (${topByRevenue[0].unitsSold.toLocaleString()} units).`,
      });
    }

    // Profitability insight
    if (hasCostData && profitMargin !== null) {
      businessInsights.push({
        id: 'margin-summary',
        type: profitMargin >= 30 ? 'POSITIVE' : 'NEUTRAL',
        title: 'Gross Margin Performance',
        text: `Overall gross margin stands at ${profitMargin}% with total profit of ₦${totalProfit.toLocaleString()}.`,
      });
    } else {
      businessInsights.push({
        id: 'no-cost-data',
        type: 'NOTICE',
        title: 'Cost Information Notice',
        text: 'Uploaded records do not contain cost price data. Profitability analysis will be enabled once cost columns are provided.',
      });
    }

    // MoM Growth insight
    if (!isAllTime && activeMonth && activeYear) {
      const currSummary = allSummaries.find((s) => s.year === activeYear && s.month === activeMonth);
      const prevSummary = allSummaries.find((s) => (
        activeMonth === 1 ? (s.year === activeYear - 1 && s.month === 12) : (s.year === activeYear && s.month === activeMonth - 1)
      ));

      if (currSummary && prevSummary && prevSummary.totalRevenue > 0) {
        const growth = ((currSummary.totalRevenue - prevSummary.totalRevenue) / prevSummary.totalRevenue) * 100;
        const formattedGrowth = Math.abs(growth).toFixed(1);
        if (growth >= 0) {
          businessInsights.push({
            id: 'mom-growth',
            type: 'POSITIVE',
            title: 'Month-over-Month Growth',
            text: `Revenue expanded by +${formattedGrowth}% compared to ${MONTH_NAMES[prevSummary.month - 1]}.`,
          });
        } else {
          alerts.push({
            id: 'mom-decline',
            type: 'WARNING',
            title: 'Revenue Contraction Alert',
            text: `Revenue declined by ${formattedGrowth}% compared to ${MONTH_NAMES[prevSummary.month - 1]}.`,
          });
        }
      }
    }

    // Best Day insight
    if (bestDay && bestDay.revenue > 0) {
      businessInsights.push({
        id: 'peak-day',
        type: 'TREND',
        title: 'Peak Sales Day',
        text: `Highest sales volume occurred on ${bestDay.date} with ₦${bestDay.revenue.toLocaleString()} recorded.`,
      });
    }

    return {
      hasData: true,
      period: {
        isAllTime,
        year: activeYear,
        month: activeMonth,
        monthName: activeMonth ? MONTH_NAMES[activeMonth - 1] : 'All Time',
        label: isAllTime ? 'All Time' : `${MONTH_NAMES[activeMonth - 1]} ${activeYear}`,
      },
      kpis: {
        totalRevenue,
        totalCost: hasCostData ? totalCost : null,
        totalProfit: hasCostData ? totalProfit : null,
        profitMargin,
        totalUnitsSold,
        uniqueProducts: uniqueProductsCount,
        totalTransactions,
        averageOrderValue,
        hasCostData,
      },
      topProducts: {
        byRevenue: topByRevenue,
        byUnits: topByUnits,
        byProfit: topByProfit,
        highestMargin: highestMarginProducts,
      },
      dailyTrend,
      bestDay,
      worstDay,
      monthlyComparison,
      categoryPerformance,
      productPerformance: productList,
      businessInsights,
      alerts,
    };
  }

  /**
   * Retrieves paginated raw transactions with search and filtering.
   */
  async getRawTransactions(orgId, { year, month, search, category, page = 1, limit = 50, sortBy = 'transactionDate', sortOrder = 'desc' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where = { orgId };
    if (year && year !== 'all') where.year = parseInt(year, 10);
    if (month && month !== 'all') where.month = parseInt(month, 10);
    if (category) where.categoryName = category;
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { productName: { contains: q, mode: 'insensitive' } },
        { productSku: { contains: q, mode: 'insensitive' } },
        { invoiceId: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy = {};
    orderBy[sortBy || 'transactionDate'] = sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, rows] = await Promise.all([
      prisma.salesTransaction.count({ where }),
      prisma.salesTransaction.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
    ]);

    return {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
      rows,
    };
  }

  /**
   * Retrieves past batch import records for this organization.
   */
  async getImportHistory(orgId) {
    return prisma.salesBatchImport.findMany({
      where: { orgId },
      orderBy: { uploadedAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Deletes an import batch and recomputes all affected monthly summaries.
   */
  async deleteImportBatch(orgId, batchId) {
    const batch = await prisma.salesBatchImport.findFirst({
      where: { id: batchId, orgId },
    });
    if (!batch) throw Object.assign(new Error('Import batch not found.'), { status: 404 });

    // Identify affected periods before deletion
    const affectedPeriods = await prisma.salesTransaction.findMany({
      where: { importBatchId: batchId },
      select: { year: true, month: true },
      distinct: ['year', 'month'],
    });

    // Delete the batch (cascade deletes its transactions)
    await prisma.salesBatchImport.delete({
      where: { id: batchId },
    });

    // Recalculate monthly summaries for all affected periods
    const SalesImportService = require('./SalesImportService');
    for (const p of affectedPeriods) {
      await SalesImportService.recalculateMonthlySummary(orgId, p.year, p.month);
    }

    return { success: true, deletedBatchId: batchId, affectedMonthsCount: affectedPeriods.length };
  }
}

module.exports = new SalesAnalyticsService();
