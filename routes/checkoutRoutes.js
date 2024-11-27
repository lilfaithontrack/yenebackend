import express from 'express';
import {
  createCheckout,
  getAllCheckouts,
  getCheckoutById,
  updateCheckoutStatus,
  deleteCheckout,
} from '../controllers/checkoutController.js';

const router = express.Router();

router.post('/create', createCheckout);
router.get('/checkout', getAllCheckouts);
router.get('/checkout/:id', getCheckoutById);
router.put('/checkout/:id', updateCheckoutStatus);
router.delete('/checkout/:id', deleteCheckout);

export default router;
