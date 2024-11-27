import express from 'express';
import {
  createReceipt,
  getAllReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
} from '../controllers/receiptController.js';
import adminAuth from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.post('/receipt', createReceipt); // Create a receipt
router.get('/receipt', adminAuth, getAllReceipts); // Get all receipts
router.get('/receipt/:id', getReceiptById); // Get a receipt by ID
router.put('/receipt/:id', updateReceipt); // Update a receipt
router.delete('/receipt/:id', deleteReceipt); // Delete a receipt by ID

export default router;
