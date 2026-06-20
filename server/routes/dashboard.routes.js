const router = require('express').Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getDashboardStats);

module.exports = router;