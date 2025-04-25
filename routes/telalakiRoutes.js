import express from 'express';
import {
  registerDriver,
  updateApproval,
  submitPaymentProof,
  adminApprovePayment,
  driverApproveCash,
  createDelivery,
  updatePricing,
} from '../controllers/telalakiController.js'; // Assuming this is the correct controller path

// --- Optional: Import your middleware ---
// import { isAdmin, isAuthenticated, isDriver } from '../middleware/authMiddleware.js';
// import { validateRegistration, validateApproval, ... } from '../middleware/validationMiddleware.js';
// ------------------------------------

const router = express.Router();

// --- Driver Registration ---
// POST /drivers/register - Register a new driver (linked to a sender)
// Middleware suggestion: Input validation
router.post('/drivers/register', /* validateRegistration, */ registerDriver);

// --- Approvals (Admin) ---
// PATCH /admin/approvals - Admin approves or rejects a driver registration
// Middleware suggestion: Authentication (isAdmin), Input validation
router.patch('/admin/approvals', /* isAdmin, validateApproval, */ updateApproval); // Changed from POST

// --- Deliveries ---
// POST /deliveries - Create a new delivery request
// Middleware suggestion: Authentication (isAuthenticated - Sender role), Input validation
router.post('/deliveries', /* isAuthenticated, */ createDelivery); // Changed path

// --- Payments ---
// PATCH /payments/proof - Sender submits payment proof for a delivery
// Middleware suggestion: Authentication (isAuthenticated - Sender role), Input validation
router.patch('/payments/proof', /* isAuthenticated, */ submitPaymentProof); // Changed from POST, changed path

// PATCH /admin/payments/approve - Admin approves a screenshot payment
// Middleware suggestion: Authentication (isAdmin), Input validation
router.patch('/admin/payments/approve', /* isAdmin, */ adminApprovePayment); // Changed from POST, changed path

// PATCH /driver/payments/approve-cash - Driver confirms cash payment received
// Middleware suggestion: Authentication (isDriver), Input validation, Authorization (check if assigned driver?)
router.patch('/driver/payments/approve-cash', /* isDriver, */ driverApproveCash); // Changed from POST, changed path

// --- Pricing (Admin) ---
// PATCH /admin/pricing - Update dynamic pricing settings
// Middleware suggestion: Authentication (isAdmin), Input validation
router.patch('/admin/pricing', /* isAdmin, */ updatePricing); // Changed from POST, changed path

export default router;
