const { db } = require('../database');

const getAllProducts = (req, res) => {
  try {
    const { search, category_id, low_stock } = req.query;
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (search) { query += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (category_id) { query += ` AND p.category_id = ?`; params.push(category_id); }
    if (low_stock === 'true') { query += ` AND p.stock <= p.low_stock_threshold`; }
    query += ` ORDER BY p.created_at DESC`;
    const products = db.prepare(query).all(...params);
    res.json({ products });
  } catch (err) { res.status(500).json({ message: 'Failed to fetch products', error: err.message }); }
};

const getProductById = (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) { res.status(500).json({ message: 'Failed to fetch product', error: err.message }); }
};

const createProduct = (req, res) => {
  try {
    const { name, description, category_id, price, cost_price, shipping_cost, stock, low_stock_threshold, unit, barcode } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: 'Name and price are required.' });
    const result = db.prepare(`
      INSERT INTO products (name, description, category_id, price, cost_price, shipping_cost, stock, low_stock_threshold, unit, barcode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description || '',
      category_id || null,
      parseFloat(price) || 0,
      parseFloat(cost_price) || 0,
      parseFloat(shipping_cost) || 0,
      parseInt(stock) || 0,
      parseInt(low_stock_threshold) || 5,
      unit || 'kg',
      barcode || null
    );
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Product created', product });
  } catch (err) { res.status(500).json({ message: 'Failed to create product', error: err.message }); }
};

const updateProduct = (req, res) => {
  try {
    const { name, description, category_id, price, cost_price, shipping_cost, stock, low_stock_threshold, unit, barcode } = req.body;
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    db.prepare(`
      UPDATE products SET 
        name=?, description=?, category_id=?, price=?, cost_price=?, shipping_cost=?,
        stock=?, low_stock_threshold=?, unit=?, barcode=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      name,
      description || '',
      category_id || null,
      parseFloat(price) || 0,
      parseFloat(cost_price) || 0,
      parseFloat(shipping_cost) || 0,
      parseInt(stock) || 0,
      parseInt(low_stock_threshold) || 5,
      unit || 'kg',
      barcode || null,
      req.params.id
    );
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ message: 'Product updated', product });
  } catch (err) { res.status(500).json({ message: 'Failed to update product', error: err.message }); }
};

const deleteProduct = (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ message: 'Failed to delete product', error: err.message }); }
};

const getAllCategories = (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json({ categories });
  } catch (err) { res.status(500).json({ message: 'Failed to fetch categories', error: err.message }); }
};

const createCategory = (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });
    const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description || '');
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Category created', category });
  } catch (err) { res.status(500).json({ message: 'Failed to create category', error: err.message }); }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getAllCategories, createCategory };