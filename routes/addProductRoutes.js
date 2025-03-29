import express from 'express';
import { 
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByLocation,
  getLocationPrice,
  updateLocationPrice,
  getPendingProducts,
  approveProduct,
  upload
} from '../controllers/productController.js'; // Updated import path

const router = express.Router();

// PRODUCT ROUTES WITH LOCATION SUPPORT

// Get products (with optional location filter)
// GET /products?lat=40.7128&lng=-74.0060&radius=10
// GET /products?subcat=electronics
router.get('/', getAllProducts);

// Get products within specific location radius
// GET /products/location?lat=40.7128&lng=-74.0060&radius=20
router.get('/location', getProductsByLocation);

// Get single product with formatted location data
// GET /products/123
router.get('/:id', getProductById);

// Get location-specific price for a product
// GET /products/123/price?location=NYC
router.get('/:id/price', getLocationPrice);

// ADMIN ROUTES

// Create product with full location data
// POST /products
router.post('/', upload.array('image', 10), createProduct);

// Update product with location data
// PUT /products/123
router.put('/:id', upload.array('image', 10), updateProduct);

// Approve pending product
// PUT /products/123/approve
router.put('/:id/approve', approveProduct);

// Get pending products (for admin approval)
// GET /products/pending
router.get('/pending', getPendingProducts);

// Delete product
// DELETE /products/123
router.delete('/:id', deleteProduct);

// LOCATION-SPECIFIC PRICING ROUTES

// Update location-specific price
// PUT /products/123/price/NYC
router.put('/:id/price/:location', updateLocationPrice);

export default router;
