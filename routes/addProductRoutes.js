import express from 'express';
import { 
  getAllProducts, 
  getProductById,
  createProduct, 
  createProductForSeller,
  updateProduct, 
  updateProductForSeller,
  deleteProduct, 
  approveProduct,
  getApprovedProducts,
  upload 
} from '../controllers/addProductController.js';

const router = express.Router();

// Route to fetch all products
router.get('/', getAllProducts);

// Route to fetch approved products
router.get('/approved', getApprovedProducts);

// Route to fetch a product by ID
router.get('/:id', getProductById); 

// Route to create a product (admin)
router.post('/add', upload.array('image', 10), createProduct);

// Route to create a product (seller, requires approval)
router.post('/seller/add', upload.array('image', 10), createProductForSeller);

// Route to update a product (admin)
router.put('/:id', upload.array('image', 10), updateProduct);

// Route to update a product (seller, sets status to pending)
router.put('/seller/:id', upload.array('image', 10), updateProductForSeller);

// Route to approve a product
router.put('/approve/:id', approveProduct);

// Route to delete a product by ID
router.delete('/:id', deleteProduct);

export default router;
