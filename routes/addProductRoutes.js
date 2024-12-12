import express from 'express';
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  upload,
} from '../controllers/addProductController.js';

const router = express.Router();

// Routes for products
router.get('/products', getAllProducts);
router.post('/products', upload.single('image'), addProduct);
router.put('/products/:id', upload.single('image'), updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
