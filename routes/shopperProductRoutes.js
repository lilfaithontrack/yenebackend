import express from 'express';
import {
    createProduct,
    updateProduct,
    getAllPendingProducts,
    deleteProduct,
    getAllProducts,
    getProductById,
    getProductsByLocation,
    getMyShopApprovedProducts,
    getMyShopPendingProducts,
    getAllMyProducts,
    getMyShopProductById,
    upload
} from '../controllers/shopperProductController.js';
import { verifyShopper } from '../middlewares/verifyShopper.js';

const router = express.Router();

// Public Route
router.get('/', getAllProducts);
router.get('/search/location', getProductsByLocation);

// Protected Routes for Shop Owner
router.post('/', verifyShopper, upload, createProduct);
router.get('/pendings', getAllPendingProducts);
router.put('/:id', upload, updateProduct);
router.delete('/:id', verifyShopper, deleteProduct);
router.get('/my-shop/approved', verifyShopper, getMyShopApprovedProducts);
router.get('/my-shop/pending', verifyShopper, getMyShopPendingProducts);
router.get('/my-shop/:id', verifyShopper, getMyShopProductById);
router.get('/my-products/:shopper_id', verifyShopper, getAllMyProducts);


// Public Product Detail
router.get('/:id', getProductById);

export default router;
