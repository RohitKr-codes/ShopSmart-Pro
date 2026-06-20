const router = require('express').Router();
const { createBill, getAllBills, getBillById, deleteBill, deleteMultipleBills } = require('../controllers/billing.controller');
const { verifyToken } = require('../middleware/auth');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { db } = require('../database');

router.get('/', verifyToken, getAllBills);
router.post('/', verifyToken, createBill);
router.get('/:id', verifyToken, getBillById);
router.delete('/bulk', verifyToken, deleteMultipleBills);
router.delete('/:id', verifyToken, deleteBill);
router.get('/:id/pdf', verifyToken, (req, res) => {
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
  if (!bill) return res.status(404).json({ message: 'Bill not found' });
  const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(bill.created_by);
  generateInvoicePDF(bill, items, user, res);
});

module.exports = router;