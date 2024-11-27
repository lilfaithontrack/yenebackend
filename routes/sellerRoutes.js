import express from 'express';
import {
  loginSeller,
  registerSeller,
  getAllSellers,
  getSellerById,
  updateSeller,
  deleteSeller,
} from '../controllers/sellerController.js';
import { authenticateSeller } from '../middlewares/sellermiddleware.js'; // Ensure this matches your middleware file path

const router = express.Router();

router.post('/register', registerSeller);
router.post('/login', loginSeller);
router.get('/', authenticateSeller, getAllSellers); // Protect this route with authentication middleware
router.get('/:id', authenticateSeller, getSellerById); // Protect this route with authentication middleware
router.put('/:id', authenticateSeller, updateSeller); // Protect this route with authentication middleware
router.delete('/:id', authenticateSeller, deleteSeller); // Protect this route with authentication middleware

export default router;
