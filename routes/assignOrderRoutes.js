import express from 'express';
import {
  assignPaymentToShopperAndDelivery,
  getAssignments,
  updateAssignmentStatus,
  getAllAssignedOrders,
  getOrdersForShopper,
  getOrdersForDeliveryBoy,
} from '../controllers/assignOrderController.js';

const router = express.Router();

router.post('/assign/:payment_id', assignPaymentToShopperAndDelivery);
router.get('/assignments', getAssignments);
router.put('/assignments/:assignment_id', updateAssignmentStatus);

// Updated route to match the desired URL
router.get('/all-assignments', getAllAssignedOrders);

// New routes
router.get('/shopper-orders/:shopper_id', getOrdersForShopper);
router.get('/delivery-boy-orders/:delivery_boy_id', getOrdersForDeliveryBoy);

export default router;
