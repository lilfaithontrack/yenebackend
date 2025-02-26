import express from 'express';
import { 
  getAllProducts, 
  getProductById,
  createProduct, 
  sellerUploadProduct,  // New seller upload function
  approveProduct,       // New admin approval function
  updateProduct, 
  updateSellerProduct,  // New seller update function
  deleteProduct, 
  upload 
} from '../controllers/addProductController.js';

const router = express.Router();

// Route to fetch all products
router.get('/', getAllProducts);

// Route to get a product by ID
router.get('/:id', getProductById);

// Route for admin to create a product (goes live immediately)
router.post('/add', upload.array('image', 10), createProduct); 

// Route for seller to upload a product (requires approval)
router.post('/seller/add', upload.array('image', 10), sellerUploadProduct);

// Route for admin to approve/reject a product
router.put('/approve/:id', approveProduct);

// Route for admin to update a product
router.put('/:id', upload.array('image', 10), updateProduct);

// Route for seller to update their own product (can't change status)
router.put('/seller/:id', upload.array('image', 10), updateSellerProduct);

// Route to delete a product by ID
router.delete('/:id', deleteProduct);

export default router;
