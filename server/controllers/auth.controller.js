const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const register = (req, res) => {
  try {
    const { name, email, password, shop_name, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userRole = role || 'owner';

    const result = db.prepare(
      'INSERT INTO users (name, email, password, role, shop_name, phone) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, hashedPassword, userRole, shop_name || '', phone || '');

    const user = db.prepare('SELECT id, name, email, role, shop_name, phone FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user);

    res.status(201).json({ message: 'Registration successful', token, user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ message: 'Login successful', token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

const getMe = (req, res) => {
  res.json({ user: req.user });
};

const updateProfile = (req, res) => {
  try {
    const { name, shop_name, phone, address } = req.body;
    db.prepare(
      'UPDATE users SET name = ?, shop_name = ?, phone = ?, address = ? WHERE id = ?'
    ).run(name, shop_name, phone, address, req.user.id);

    const updated = db.prepare('SELECT id, name, email, role, shop_name, phone, address FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

const changePassword = (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Password change failed', error: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };