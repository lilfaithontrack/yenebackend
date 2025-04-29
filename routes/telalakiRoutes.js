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
    registerSender,         // Added
    loginSender,            // Added
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
    // loginDriver,          // TODO: Add driver login controller import
    // getAllDeliveries,
    // getAllDrivers,
    // getPendingApprovals
} from '../controllers/telalakiController.js'; // Adjust path if necessary

// --- Optional: Import your actual middleware ---
// --- Authentication & Authorization ---
// import { isAuthenticated } from '../middleware/authMiddleware.js'; // General login check
// import { isAdmin } from '../middleware/authMiddleware.js';        // Check for Admin role
// import { isDriver } from '../middleware/authMiddleware.js';       // Check for Driver role
// import { isSender } from '../middleware/authMiddleware.js';       // Check for Sender role (if needed beyond isAuthenticated)
// import { checkOwnershipOrAdmin } from '../middleware/authMiddleware.js'; // Example for resource access

// --- Validation ---
// import { validate } from '../middleware/validationMiddleware.js'; // Main validation runner
// import { senderRegistrationSchema, senderLoginSchema, driverRegistrationSchema, ... } from '../validators/telalakiValidators.js'; // Validation schemas

// -------------------------------------------------

const router = express.Router();

// =============================================
// Public / Semi-Public Routes (Authentication/Registration)
// =============================================

// POST /api/telalaki/senders/register - Register a new sender
// Middleware: Input validation
router.post(
    '/senders/register',
    // validate(senderRegistrationSchema), // Example validation middleware
    registerSender
);

// POST /api/telalaki/senders/login - Log in an existing sender
// Middleware: Input validation
router.post(
    '/senders/login',
    // validate(senderLoginSchema), // Example validation middleware
    loginSender
);

// POST /api/telalaki/drivers/register - Register a new driver (linked to a sender account)
// Middleware: Input validation
router.post(
    '/drivers/register',
    // validate(driverRegistrationSchema), // Example validation middleware
    registerDriver
);

// POST /api/telalaki/drivers/login - Log in an existing driver
// Middleware: Input validation
// router.post('/drivers/login', /* validate(driverLoginSchema), */ loginDriver); // TODO: Implement loginDriver controller and uncomment


// =============================================
// Sender Routes (Require Sender Authentication via JWT)
// =============================================

// POST /api/telalaki/deliveries - Create a new delivery request
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isSender type in JWT), Input validation
router.post(
    '/deliveries',
    // isAuthenticated, // Ensure JWT is valid
    // isSender,        // Ensure JWT payload indicates 'sender' type
    // validate(deliverySchema),
    createDelivery
);

// PATCH /api/telalaki/payments/proof - Sender submits payment proof for a delivery
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isSender type in JWT), Input validation
router.patch(
    '/payments/proof',
    // isAuthenticated,
    // isSender,
    // validate(paymentProofSchema),
    submitPaymentProof
);

// GET /api/telalaki/deliveries/my - Get deliveries initiated by the logged-in sender
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isSender type in JWT)
// router.get('/deliveries/my', /* isAuthenticated, isSender, */ getMyDeliveries); // TODO: Implement getMyDeliveries

// GET /api/telalaki/notifications/my - Get notifications for the logged-in user (sender OR driver)
// Middleware: Authentication (isAuthenticated -> check JWT)
// router.get('/notifications/my', /* isAuthenticated, */ getNotifications); // TODO: Implement getNotifications

// PATCH /api/telalaki/notifications/:id/read - Mark a specific notification as read
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (check if notification belongs to user based on JWT)
// router.patch('/notifications/:id/read', /* isAuthenticated, checkNotificationOwnership, */ markNotificationRead); // TODO: Implement markNotificationRead


// =============================================
// Driver Routes (Require Driver Authentication via JWT)
// =============================================

// PATCH /api/telalaki/driver/payments/approve-cash - Driver confirms cash payment received
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isDriver type in JWT), Input validation, Authorization (check assignment)
router.patch(
    '/driver/payments/approve-cash',
    // isAuthenticated,
    // isDriver,
    // validate(cashApprovalSchema),
    // checkDeliveryAssignment, // Custom middleware to check if driver (from JWT) is assigned
    driverApproveCash
);

// PATCH /api/telalaki/driver/location - Driver updates their current location
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isDriver type in JWT), Input validation
// router.patch('/driver/location', /* isAuthenticated, isDriver, validateLocationUpdate, */ updateDriverLocation); // TODO: Implement updateDriverLocation

// PATCH /api/telalaki/driver/deliveries/:id/status - Driver updates the status of an assigned delivery
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isDriver type in JWT), Input validation, Authorization (check assignment)
// router.patch('/driver/deliveries/:id/status', /* isAuthenticated, isDriver, validateStatusUpdate, checkDeliveryAssignment, */ updateDeliveryStatus); // TODO: Implement updateDeliveryStatus

// GET /api/telalaki/driver/deliveries/assigned - Get deliveries assigned to the logged-in driver
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isDriver type in JWT)
// router.get('/driver/deliveries/assigned', /* isAuthenticated, isDriver, */ getAssignedDeliveries); // TODO: Implement getAssignedDeliveries


// =============================================
// Admin Routes (Require Admin Authentication via JWT)
// =============================================

// PATCH /api/telalaki/admin/approvals - Admin approves or rejects a driver registration
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isAdmin role in JWT), Input validation
router.patch(
    '/admin/approvals',
    // isAuthenticated,
    // isAdmin,
    // validate(approvalSchema),
    updateApproval
);

// PATCH /api/telalaki/admin/payments/approve - Admin approves a screenshot payment
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isAdmin role in JWT), Input validation
router.patch(
    '/admin/payments/approve',
    // isAuthenticated,
    // isAdmin,
    // validate(paymentApprovalSchema),
    adminApprovePayment
);

// PATCH /api/telalaki/admin/pricing - Update dynamic pricing settings
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isAdmin role in JWT), Input validation
router.patch(
    '/admin/pricing',
    // isAuthenticated,
    // isAdmin,
    // validate(pricingSchema),
    updatePricing
);

// GET /api/telalaki/admin/deliveries - Admin views all deliveries (with filtering/pagination)
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isAdmin role in JWT)
// router.get('/admin/deliveries', /* isAuthenticated, isAdmin, */ getAllDeliveries); // TODO: Implement getAllDeliveries

// GET /api/telalaki/admin/drivers - Admin views all drivers (with filtering/pagination)
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isAdmin role in JWT)
// router.get('/admin/drivers', /* isAuthenticated, isAdmin, */ getAllDrivers); // TODO: Implement getAllDrivers

// GET /api/telalaki/admin/approvals/pending - Admin views pending driver approvals
// Middleware: Authentication (isAuthenticated -> check JWT), Authorization (isAdmin role in JWT)
// router.get('/admin/approvals/pending', /* isAuthenticated, isAdmin, */ getPendingApprovals); // TODO: Implement getPendingApprovals


export default router;
