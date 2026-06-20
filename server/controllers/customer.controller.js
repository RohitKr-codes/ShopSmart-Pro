const { db } = require('../database');

const getAllCustomers = (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    if (search) { query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
    const customers = db.prepare(query).all(...params);
    res.json({ customers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers', error: err.message });
  }
};

const getCustomerById = (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const bills = db.prepare('SELECT * FROM bills WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
    res.json({ customer, bills });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customer', error: err.message });
  }
};

const createCustomer = (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Customer name is required.' });
    const result = db.prepare('INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)').run(name, phone || '', email || '', address || '');
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Customer created', customer });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create customer', error: err.message });
  }
};

const updateCustomer = (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Customer not found' });
    db.prepare('UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?').run(name, phone, email, address, req.params.id);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json({ message: 'Customer updated', customer });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update customer', error: err.message });
  }
};

const deleteCustomer = (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Customer not found' });
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete customer', error: err.message });
  }
};

module.exports = { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer };