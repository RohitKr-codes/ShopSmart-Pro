const router = require('express').Router();
const { getLowStockProducts, updateStock, getInventoryLogs } = require('../controllers/inventory.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/low-stock', verifyToken, getLowStockProducts);
router.get('/logs', verifyToken, getInventoryLogs);
router.post('/update-stock', verifyToken, updateStock);

module.exports = router;