import express from 'express';
import {
  // Import all the necessary functions from your controller
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByLocation,
  // Make sure to import the upload middleware you defined in your controller
  upload
} from '../controllers/addProductController.js'; // Using your controller file name

const router = express.Router();

// --- PUBLIC ROUTES (for anyone to view products) ---

// GET /api/products -> Gets all products, with optional filters
router.get('/', getAllProducts);

// GET /api/products/location -> Gets products based on a geographic radius search
// This must be defined BEFORE '/:id' to work correctly.
router.get('/location', getProductsByLocation);

// GET /api/products/:id -> Gets a single product by its unique ID
router.get('/:id', getProductById);


// --- PRODUCT MANAGEMENT ROUTES (for authenticated users/admins) ---

// POST /api/products -> Creates a new product.
// The 'upload' middleware is essential here, using the correct field name 'images'.
router.post('/', upload, createProduct);

// PUT /api/products/:id -> Updates an existing product.
// The 'upload' middleware is also needed here for updating images.
router.put('/:id', upload, updateProduct);

// DELETE /api/products/:id -> Deletes a product.
router.delete('/:id', deleteProduct);


// The old location price routes are now handled by the main GET and PUT routes for a product.

export default router;
