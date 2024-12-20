import express from 'express';
import {
  assignPaymentToShopperAndDelivery,
  getPaymentAssignments,
  updateAssignmentStatus,
} from '../controllers/assignOrderController.js';

const router = express.Router();

// Route to assign a payment (order) to a shopper and delivery boy
router.post('/assign/:payment_id', assignPaymentToShopperAndDelivery);

// Route to get all assignments for a specific payment
router.get('/assignments/:payment_id', getPaymentAssignments);

// Route to update the status of an assignment
router.patch('/assignments/:assignment_id/status', updateAssignmentStatus);

export default router;
