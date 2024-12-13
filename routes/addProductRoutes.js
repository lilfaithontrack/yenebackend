import express from 'express';
import { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  upload 
} from '../controllers/addProductController.js';

const router = express.Router();

// Route to fetch all products
router.get('/', getAllProducts);

// Route to create a new product (with optional image upload)
router.post('/', upload.array('image', 10), createProduct); // Allows uploading up to 10 images

// Route to update a product by ID (with optional image upload)
router.put('/:id', upload.single('image'), updateProduct);

// Route to delete a product by ID
router.delete('/:id', deleteProduct);

export default router;
