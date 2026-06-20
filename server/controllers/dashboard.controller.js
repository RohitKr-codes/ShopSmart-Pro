const { db } = require('../database');

const getDashboardStats = (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);

    const todaySales = db.prepare(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count FROM bills WHERE DATE(created_at) = ?`).get(today);
    const monthSales = db.prepare(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count FROM bills WHERE strftime('%Y-%m', created_at) = ?`).get(thisMonth);
    const totalProducts = db.prepare(`SELECT COUNT(*) as count FROM products`).get();
    const lowStockCount = db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock <= low_stock_threshold`).get();
    const totalCustomers = db.prepare(`SELECT COUNT(*) as count FROM customers`).get();
    const totalRevenue = db.prepare(`SELECT COALESCE(SUM(total),0) as total FROM bills`).get();

    // Last 7 days sales chart data
    const last7Days = db.prepare(`
      SELECT DATE(created_at) as date, COALESCE(SUM(total),0) as revenue, COUNT(*) as bills
      FROM bills
      WHERE created_at >= DATE('now', '-6 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    // Top 5 selling products
    const topProducts = db.prepare(`
      SELECT bi.product_name, SUM(bi.quantity) as total_qty, SUM(bi.total) as total_revenue
      FROM bill_items bi
      GROUP BY bi.product_name
      ORDER BY total_qty DESC
      LIMIT 5
    `).all();

    // Recent bills
    const recentBills = db.prepare(`
      SELECT * FROM bills ORDER BY created_at DESC LIMIT 5
    `).all();

    // Low stock products
    const lowStockProducts = db.prepare(`
      SELECT * FROM products WHERE stock <= low_stock_threshold ORDER BY stock ASC LIMIT 5
    `).all();

    res.json({
      stats: {
        today_sales: todaySales.total,
        today_bills: todaySales.count,
        month_sales: monthSales.total,
        month_bills: monthSales.count,
        total_products: totalProducts.count,
        low_stock_count: lowStockCount.count,
        total_customers: totalCustomers.count,
        total_revenue: totalRevenue.total
      },
      last7Days,
      topProducts,
      recentBills,
      lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: err.message });
  }
};

module.exports = { getDashboardStats };