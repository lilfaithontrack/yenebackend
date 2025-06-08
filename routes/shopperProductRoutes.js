import express from 'express';
import {
    createProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    getProductsByLocation,
    getMyShopApprovedProducts,
    getMyShopPendingProducts,
    getMyShopProductById,
    upload // multer middleware
} from '../controllers/shopperProductController.js';
import { protect } from '../middlewares/authMiddleware.js'; // Import protect middleware

const router = express.Router();

// Main Product Routes
router.route('/')
    .get(getAllProducts)
    .post(upload, createProduct);

router.get('/my-shop/approved', getMyShopApprovedProducts);
router.get('/my-shop/pending', getMyShopPendingProducts);
router.get('/search/location', getProductsByLocation);
router.get('/my-shop/:id', protect, getMyShopProductById);

// Single Product Routes (Get, Update, Delete by ID)
router.route('/:id')
    .get(getProductById)
    .put(upload, updateProduct)
    .delete(deleteProduct);

export default router;
