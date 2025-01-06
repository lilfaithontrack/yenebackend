import express from 'express';
import {
  assignPaymentToShopperAndDelivery,
  getAssignments,
  getAllAssignedOrders, // Import the function for fetching all assigned orders
  updateAssignmentStatus,
} from '../controllers/assignOrderController.js';

const router = express.Router();

// Route to assign a payment (order) to a shopper and delivery boy
router.post('/assign/:payment_id', assignPaymentToShopperAndDelivery);

// Route to get all assignments for a specific payment or filtered by shopper_id/delivery_boy_id
router.get('/', getAssignments);

// Route to get all assigned orders (no filters)
router.get('/all-assignments', getAllAssignedOrders); // New route for all assignments

// Route to update the status of an assignment
router.patch('/assignments/:assignment_id/status', updateAssignmentStatus);

export default router;
