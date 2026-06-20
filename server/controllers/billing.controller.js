const { db } = require('../database');

const generateBillNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${dateStr}-${random}`;
};

const createBill = (req, res) => {
  try {
    const { customer_id, customer_name, items, discount = 0, gst_percent = 18, payment_method = 'cash', notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'At least one item is required.' });

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) return res.status(404).json({ message: `Product ${item.product_id} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountedAmount = subtotal - parseFloat(discount);
    const gst_amount = (discountedAmount * parseFloat(gst_percent)) / 100;
    const total = discountedAmount + gst_amount;
    const bill_number = generateBillNumber();

    const createBillTx = db.transaction(() => {
      const billResult = db.prepare(`
        INSERT INTO bills (bill_number, customer_id, customer_name, subtotal, discount, gst_percent, gst_amount, total, payment_method, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(bill_number, customer_id || null, customer_name || 'Walk-in Customer', subtotal, parseFloat(discount), parseFloat(gst_percent), gst_amount, total, payment_method, notes || '', req.user.id);

      const bill_id = billResult.lastInsertRowid;

      for (const item of items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
        const itemTotal = item.price * item.quantity;
        db.prepare(`INSERT INTO bill_items (bill_id, product_id, product_name, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)`)
          .run(bill_id, item.product_id, product.name, item.quantity, item.price, itemTotal);
        const newStock = product.stock - item.quantity;
        db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, item.product_id);
        db.prepare(`INSERT INTO inventory_logs (product_id, product_name, type, quantity, previous_stock, new_stock, reason, created_by) VALUES (?, ?, 'out', ?, ?, ?, ?, ?)`)
          .run(item.product_id, product.name, item.quantity, product.stock, newStock, `Sale - ${bill_number}`, req.user.id);
      }

      if (customer_id) db.prepare('UPDATE customers SET total_purchases = total_purchases + ? WHERE id = ?').run(total, customer_id);
      return bill_id;
    });

    const bill_id = createBillTx();
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(bill_id);
    const billItems = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(bill_id);
    res.status(201).json({ message: 'Bill created successfully', bill: { ...bill, items: billItems } });
  } catch (err) { res.status(500).json({ message: 'Failed to create bill', error: err.message }); }
};

const getAllBills = (req, res) => {
  try {
    const { search, from_date, to_date, limit = 50, page = 1 } = req.query;
    let query = `SELECT b.*, u.name as created_by_name FROM bills b LEFT JOIN users u ON b.created_by = u.id WHERE 1=1`;
    const params = [];
    if (search) { query += ` AND (b.bill_number LIKE ? OR b.customer_name LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (from_date) { query += ` AND DATE(b.created_at) >= ?`; params.push(from_date); }
    if (to_date) { query += ` AND DATE(b.created_at) <= ?`; params.push(to_date); }
    query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const bills = db.prepare(query).all(...params);
    const total = db.prepare(`SELECT COUNT(*) as count FROM bills WHERE 1=1${search ? " AND (bill_number LIKE ? OR customer_name LIKE ?)" : ''}${from_date ? " AND DATE(created_at) >= ?" : ''}${to_date ? " AND DATE(created_at) <= ?" : ''}`).get(...params.slice(0, -2));
    res.json({ bills, total: total.count });
  } catch (err) { res.status(500).json({ message: 'Failed to fetch bills', error: err.message }); }
};

const getBillById = (req, res) => {
  try {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(req.params.id);
    res.json({ bill: { ...bill, items } });
  } catch (err) { res.status(500).json({ message: 'Failed to fetch bill', error: err.message }); }
};

const deleteBill = (req, res) => {
  try {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    db.prepare('DELETE FROM bill_items WHERE bill_id = ?').run(req.params.id);
    db.prepare('DELETE FROM bills WHERE id = ?').run(req.params.id);
    res.json({ message: 'Bill deleted successfully' });
  } catch (err) { res.status(500).json({ message: 'Failed to delete bill', error: err.message }); }
};

const deleteMultipleBills = (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ message: 'No bill IDs provided' });
    const deleteTx = db.transaction(() => {
      for (const id of ids) {
        db.prepare('DELETE FROM bill_items WHERE bill_id = ?').run(id);
        db.prepare('DELETE FROM bills WHERE id = ?').run(id);
      }
    });
    deleteTx();
    res.json({ message: `${ids.length} bill(s) deleted successfully` });
  } catch (err) { res.status(500).json({ message: 'Failed to delete bills', error: err.message }); }
};

module.exports = { createBill, getAllBills, getBillById, deleteBill, deleteMultipleBills };