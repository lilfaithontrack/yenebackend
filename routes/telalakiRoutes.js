import express from 'express';
import {
  registerDriver,
  updateApproval,
  submitPaymentProof,
  adminApprovePayment,
  driverApproveCash,
  createDelivery,
  updatePricing,
} from '../controllers/telalakiController.js';

const router = express.Router();

// Driver Registration
router.post('/register-driver', registerDriver);

// Admin Approval (for drivers)
router.post('/admin-approve', updateApproval);

// Payment Proof Submission (screenshot or receipt)
router.post('/submit-payment-proof', submitPaymentProof);

// Admin approves payment (screenshot)
router.post('/approve-payment/admin', adminApprovePayment);

// Driver approves payment (cash)
router.post('/approve-payment/driver', driverApproveCash);

// Create Delivery Request
router.post('/create-delivery', createDelivery);

// Update Dynamic Pricing
router.post('/update-pricing', updatePricing);

export default router;
