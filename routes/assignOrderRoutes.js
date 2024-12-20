import express from 'express';
import { assignOrderToShopperAndDelivery, getOrderAssignments, updateAssignmentStatus } from '../controllers/assignOrderController.js';

const router = express.Router();

// Route to assign an order to a shopper and delivery boy
router.put('/:order_id/assign', assignOrderToShopperAndDelivery);

// Route to get the assignments for an order
router.get('/:order_id/assignments', getOrderAssignments);

// Route to update the status of an assignment
router.put('/assignment/:assignment_id/status', updateAssignmentStatus);

export default router;
