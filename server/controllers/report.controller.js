const { db } = require('../database');
const { generateCSV } = require('../utils/csvExport');

const getSalesReport = (req, res) => {
  try {
    const { from_date, to_date, group_by = 'day' } = req.query;
    let dateFormat = group_by === 'month' ? '%Y-%m' : '%Y-%m-%d';

    let query = `
      SELECT strftime('${dateFormat}', created_at) as period,
      COUNT(*) as total_bills,
      COALESCE(SUM(total),0) as revenue,
      COALESCE(SUM(discount),0) as total_discount,
      COALESCE(SUM(gst_amount),0) as total_gst
      FROM bills WHERE 1=1
    `;
    const params = [];
    if (from_date) { query += ` AND DATE(created_at) >= ?`; params.push(from_date); }
    if (to_date) { query += ` AND DATE(created_at) <= ?`; params.push(to_date); }
    query += ` GROUP BY period ORDER BY period DESC`;

    const data = db.prepare(query).all(...params);
    res.json({ report: data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate report', error: err.message });
  }
};

const getProductReport = (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let query = `
      SELECT bi.product_name, SUM(bi.quantity) as total_sold, 
      SUM(bi.total) as total_revenue, COUNT(DISTINCT bi.bill_id) as times_sold
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE 1=1
    `;
    const params = [];
    if (from_date) { query += ` AND DATE(b.created_at) >= ?`; params.push(from_date); }
    if (to_date) { query += ` AND DATE(b.created_at) <= ?`; params.push(to_date); }
    query += ` GROUP BY bi.product_name ORDER BY total_sold DESC`;

    const data = db.prepare(query).all(...params);
    res.json({ report: data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate report', error: err.message });
  }
};

const exportCSV = (req, res) => {
  try {
    const { type = 'sales', from_date, to_date } = req.query;
    let data = [];

    if (type === 'sales') {
      let query = `SELECT bill_number, customer_name, subtotal, discount, gst_amount, total, payment_method, created_at FROM bills WHERE 1=1`;
      const params = [];
      if (from_date) { query += ` AND DATE(created_at) >= ?`; params.push(from_date); }
      if (to_date) { query += ` AND DATE(created_at) <= ?`; params.push(to_date); }
      query += ` ORDER BY created_at DESC`;
      data = db.prepare(query).all(...params);
    } else if (type === 'products') {
      data = db.prepare(`SELECT name, price, cost_price, stock, unit FROM products ORDER BY name`).all();
    } else if (type === 'customers') {
      data = db.prepare(`SELECT name, phone, email, total_purchases, created_at FROM customers ORDER BY name`).all();
    }

    const csv = generateCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export CSV', error: err.message });
  }
};

module.exports = { getSalesReport, getProductReport, exportCSV };