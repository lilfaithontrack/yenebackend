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

  upload
} from '../controllers/addProductController.js';

const router = express.Router();

// PUBLIC ROUTES
router.get('/', getAllProducts); // Get all products
router.get('/location', getProductsByLocation); // Get products by location
router.get('/:id', getProductById); // Get single product
router.get('/:id/price', getLocationPrice); // Get location price

// PRODUCT MANAGEMENT ROUTES
router.post('/add', upload.array('image', 10),  createProduct); // Create product
router.put('/:id', upload.array('image', 10), updateProduct); // Update product
router.delete('/:id', deleteProduct); // Delete product

 // Approve product

// LOCATION PRICING ROUTES
router.put('/:id/price/:location', updateLocationPrice); // Update location price

export default router;
