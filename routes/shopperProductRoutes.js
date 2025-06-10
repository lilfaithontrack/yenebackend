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
} from '../controllers/shopperProductController.js'; // Import protect middleware
import { verifyShopper } from '../middlewares/verifyShopper.js';

const router = express.Router();

// Main Product Routes
router.route('/')
    .get(getAllProducts)
    .post(upload, createProduct);

router.get('/my-shop/approved', verifyShopper, getMyShopApprovedProducts);
router.get('/my-shop/pending',  verifyShopper, getMyShopPendingProducts);
router.get('/search/location', getProductsByLocation);
router.get('/my-shop/:id',  verifyShopper, getMyShopProductById);

// Single Product Routes (Get, Update, Delete by ID)
router.route('/:id')
    .get(getProductById)
    .put(upload, updateProduct)
    .delete(deleteProduct);

export default router;
