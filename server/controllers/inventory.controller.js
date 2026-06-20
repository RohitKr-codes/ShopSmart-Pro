const { db } = require('../database');

const getLowStockProducts = (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock <= p.low_stock_threshold
      ORDER BY p.stock ASC
    `).all();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch low stock', error: err.message });
  }
};

const updateStock = (req, res) => {
  try {
    const { product_id, type, quantity, reason } = req.body;

    if (!product_id || !type || !quantity) {
      return res.status(400).json({ message: 'product_id, type and quantity are required.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const previousStock = product.stock;
    let newStock;

    if (type === 'in') {
      newStock = previousStock + parseInt(quantity);
    } else if (type === 'out') {
      newStock = previousStock - parseInt(quantity);
      if (newStock < 0) return res.status(400).json({ message: 'Insufficient stock' });
    } else {
      return res.status(400).json({ message: 'Type must be "in" or "out"' });
    }

    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, product_id);

    db.prepare(`
      INSERT INTO inventory_logs (product_id, product_name, type, quantity, previous_stock, new_stock, reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(product_id, product.name, type, quantity, previousStock, newStock, reason || '', req.user.id);

    res.json({ message: 'Stock updated successfully', previous_stock: previousStock, new_stock: newStock });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update stock', error: err.message });
  }
};

const getInventoryLogs = (req, res) => {
  try {
    const { product_id, type, limit = 50 } = req.query;
    let query = `
      SELECT il.*, u.name as updated_by_name 
      FROM inventory_logs il
      LEFT JOIN users u ON il.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) { query += ' AND il.product_id = ?'; params.push(product_id); }
    if (type) { query += ' AND il.type = ?'; params.push(type); }

    query += ` ORDER BY il.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const logs = db.prepare(query).all(...params);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
  }
};

module.exports = { getLowStockProducts, updateStock, getInventoryLogs };