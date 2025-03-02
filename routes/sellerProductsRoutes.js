import express from 'express';
import { 
  createSellerProduct, 
  approveSellerProduct, 
  getSellerProducts, 
  getPendingSellerProducts, 
  deleteSellerProduct,
  upload 
} from '../controllers/sellerProductController.js';

const router = express.Router();

// Create Seller Product (Always Pending)
router.post('/add', upload.array('image', 10), createSellerProduct);

// Approve a Seller Product (Admin Only)
router.put('/approve/:id', approveSellerProduct);

// Get All Pending Seller Products (Admin)
router.get('/pending', getPendingSellerProducts);

// Get Products by Seller Email
router.get('/seller/:seller_email', getSellerProducts);

// Delete Seller Product
router.delete('/:id', deleteSellerProduct);

export default router;
