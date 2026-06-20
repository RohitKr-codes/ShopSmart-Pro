const router = require('express').Router();
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getAllCategories, createCategory } = require('../controllers/product.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getAllProducts);
router.get('/categories', verifyToken, getAllCategories);
router.post('/categories', verifyToken, createCategory);
router.get('/:id', verifyToken, getProductById);
router.post('/', verifyToken, createProduct);
router.put('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

module.exports = router;