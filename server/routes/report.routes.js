const router = require('express').Router();
const { getSalesReport, getProductReport, exportCSV } = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/sales', verifyToken, getSalesReport);
router.get('/products', verifyToken, getProductReport);
router.get('/export', verifyToken, exportCSV);

module.exports = router;