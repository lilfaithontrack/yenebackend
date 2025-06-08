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
    upload // The multer middleware for file uploads
} from '../controllers/shopperProductController.js';

// IMPORTANT: Import your authentication middleware.
// The path might be different depending on your project structure.
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/*
* ===============================================================
* PRODUCT ROUTE DEFINITIONS
* ===============================================================
*/

// --- Main Product Routes ---
router.route('/')
    /**
     * @route   GET /api/products
     * @desc    Get all public, 'approved' products
     * @access  Public
     */
    .get(getAllProducts)
    /**
     * @route   POST /api/products
     * @desc    Create a new product
     * @access  Private (Shopper must be logged in)
     */
    .post(protect, upload, createProduct);


// --- Shopper's Personal "My Shop" Routes ---
/**
 * @route   GET /api/products/my-shop/approved
 * @desc    Get the logged-in shopper's own approved products
 * @access  Private
 */
router.get('/my-shop/approved', protect, getMyShopApprovedProducts);

/**
 * @route   GET /api/products/my-shop/pending
 * @desc    Get the logged-in shopper's own pending products
 * @access  Private
 */
router.get('/my-shop/pending', protect, getMyShopPendingProducts);


// --- Search Routes ---
/**
 * @route   GET /api/products/search/location
 * @desc    Get products within a certain geographic radius
 * @access  Public
 */
router.get('/search/location', getProductsByLocation);


// --- Single Product Routes (by ID) ---
router.route('/:id')
    /**
     * @route   GET /api/products/:id
     * @desc    Get a single product by its ID
     * @access  Public
     */
    .get(getProductById)
    /**
     * @route   PUT /api/products/:id
     * @desc    Update a product owned by the logged-in shopper
     * @access  Private
     */
    .put(protect, upload, updateProduct)
    /**
     * @route   DELETE /api/products/:id
     * @desc    Delete a product owned by the logged-in shopper
     * @access  Private
     */
    .delete(protect, deleteProduct);


export default router;
