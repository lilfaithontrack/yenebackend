/**
 * routes/telalakiRoutes.js
 *
 * Defines API routes for the Telalaki application functionalities.
 * Maps routes to controller functions and includes placeholders for
 * authentication, authorization, and validation middleware.
 */

import express from 'express';
import {
    // Import all controller functions
    registerDriver,
    updateApproval,
    createDelivery,
    submitPaymentProof,
    adminApprovePayment,
    driverApproveCash,
    updatePricing,
    // --- TODO: Import controllers for fetching data, status updates etc. ---
    // getDeliveryById,
    // getMyDeliveries,
    // updateDeliveryStatus,
    // updateDriverLocation,
    // getNotifications,
    // markNotificationRead,
} from '../controllers/telalakiController.js'; // Adjust path if necessary

// --- Optional: Import your actual middleware ---
// --- Authentication & Authorization ---
// import { isAuthenticated } from '../middleware/authMiddleware.js'; // General login check
// import { isAdmin } from '../middleware/authMiddleware.js';       // Check for Admin role
// import { isDriver } from '../middleware/authMiddleware.js';      // Check for Driver role
// import { isSender } from '../middleware/authMiddleware.js';      // Check for Sender role (if needed beyond isAuthenticated)
// import { checkOwnershipOrAdmin } from '../middleware/authMiddleware.js'; // Example for resource access

// --- Validation ---
// import { validate } from '../middleware/validationMiddleware.js'; // Main validation runner
// import { registrationSchema, approvalSchema, deliverySchema, ... } from '../validators/telalakiValidators.js'; // Validation schemas (using Joi, express-validator, etc.)

// -------------------------------------------------

const router = express.Router();

// =============================================
// Public / Semi-Public Routes
// =============================================

// POST /api/telalaki/drivers/register - Register a new driver (linked to a sender)
// Middleware: Input validation
router.post(
    '/drivers/register',
    // validate(registrationSchema), // Example validation middleware
    registerDriver
);

// =============================================
// Sender Routes (Require Authentication)
// =============================================

// POST /api/telalaki/deliveries - Create a new delivery request
// Middleware: Authentication (isSender/isAuthenticated), Input validation
router.post(
    '/deliveries',
    // isAuthenticated, // Ensure user is logged in
    // isSender,      // Ensure user has Sender role (if applicable)
    // validate(deliverySchema), // Example validation middleware
    createDelivery
);

// PATCH /api/telalaki/payments/proof - Sender submits payment proof for a delivery
// Middleware: Authentication (isSender/isAuthenticated), Input validation
router.patch(
    '/payments/proof',
    // isAuthenticated,
    // isSender,
    // validate(paymentProofSchema),
    submitPaymentProof
);

// GET /api/telalaki/deliveries/my - Get deliveries initiated by the logged-in sender
// Middleware: Authentication (isSender/isAuthenticated)
// router.get('/deliveries/my', /* isAuthenticated, isSender, */ getMyDeliveries); // TODO: Implement getMyDeliveries

// GET /api/telalaki/notifications/my - Get notifications for the logged-in user (sender or driver)
// Middleware: Authentication (isAuthenticated)
// router.get('/notifications/my', /* isAuthenticated, */ getNotifications); // TODO: Implement getNotifications

// PATCH /api/telalaki/notifications/:id/read - Mark a specific notification as read
// Middleware: Authentication (isAuthenticated), Authorization (check if notification belongs to user)
// router.patch('/notifications/:id/read', /* isAuthenticated, checkNotificationOwnership, */ markNotificationRead); // TODO: Implement markNotificationRead

// =============================================
// Driver Routes (Require Driver Authentication)
// =============================================

// PATCH /api/telalaki/driver/payments/approve-cash - Driver confirms cash payment received
// Middleware: Authentication (isDriver), Input validation, Authorization (check assignment)
router.patch(
    '/driver/payments/approve-cash',
    // isDriver,
    // validate(cashApprovalSchema),
    // checkDeliveryAssignment, // Custom middleware to check if driver is assigned
    driverApproveCash
);

// PATCH /api/telalaki/driver/location - Driver updates their current location
// Middleware: Authentication (isDriver), Input validation
// router.patch('/driver/location', /* isDriver, validateLocationUpdate, */ updateDriverLocation); // TODO: Implement updateDriverLocation

// PATCH /api/telalaki/driver/deliveries/:id/status - Driver updates the status of an assigned delivery
// Middleware: Authentication (isDriver), Input validation, Authorization (check assignment)
// router.patch('/driver/deliveries/:id/status', /* isDriver, validateStatusUpdate, checkDeliveryAssignment, */ updateDeliveryStatus); // TODO: Implement updateDeliveryStatus

// GET /api/telalaki/driver/deliveries/assigned - Get deliveries assigned to the logged-in driver
// Middleware: Authentication (isDriver)
// router.get('/driver/deliveries/assigned', /* isDriver, */ getAssignedDeliveries); // TODO: Implement getAssignedDeliveries


// =============================================
// Admin Routes (Require Admin Authentication)
// =============================================

// PATCH /api/telalaki/admin/approvals - Admin approves or rejects a driver registration
// Middleware: Authentication (isAdmin), Input validation
router.patch(
    '/admin/approvals',
    // isAdmin,
    // validate(approvalSchema),
    updateApproval
);

// PATCH /api/telalaki/admin/payments/approve - Admin approves a screenshot payment
// Middleware: Authentication (isAdmin), Input validation
router.patch(
    '/admin/payments/approve',
    // isAdmin,
    // validate(paymentApprovalSchema),
    adminApprovePayment
);

// PATCH /api/telalaki/admin/pricing - Update dynamic pricing settings
// Middleware: Authentication (isAdmin), Input validation
router.patch(
    '/admin/pricing',
    // isAdmin,
    // validate(pricingSchema),
    updatePricing
);

// GET /api/telalaki/admin/deliveries - Admin views all deliveries (with filtering/pagination)
// Middleware: Authentication (isAdmin)
// router.get('/admin/deliveries', /* isAdmin, */ getAllDeliveries); // TODO: Implement getAllDeliveries

// GET /api/telalaki/admin/drivers - Admin views all drivers (with filtering/pagination)
// Middleware: Authentication (isAdmin)
// router.get('/admin/drivers', /* isAdmin, */ getAllDrivers); // TODO: Implement getAllDrivers

// GET /api/telalaki/admin/approvals/pending - Admin views pending driver approvals
// Middleware: Authentication (isAdmin)
// router.get('/admin/approvals/pending', /* isAdmin, */ getPendingApprovals); // TODO: Implement getPendingApprovals


export default router;
