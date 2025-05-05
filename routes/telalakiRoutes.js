// routes/telalakiRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as apiController from '../controllers/telalakiController.js'; // Adjust path

const router = express.Router();

console.log("--- Telalaki API Routes Initializing (WARNING: OPEN ROUTES!) ---");

// --- START MULTER CONFIGURATION (Integrated into router file) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads/payment_proofs'); // Adjust path relative to this routes file

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory: ${uploadDir}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalNameSafe = file.originalname.replace(/\s+/g, '_');
        const extension = path.extname(originalNameSafe);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG allowed.'), false);
    }
};

const uploadPaymentProof = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});
// --- END MULTER CONFIGURATION ---


// --- Authentication ---
router.post('/auth/register/sender', apiController.registerSender);
router.post('/auth/login/sender', apiController.loginSender);
router.post('/auth/register/driver', apiController.registerDriver);
router.post('/auth/login/driver', apiController.loginDriver);
router.get(
    '/notifications/my',
    apiController.getMyNotifications
);
// --- Drivers ---
// Uses :driverId URL parameter
router.put('/drivers/:driverId/location', apiController.updateDriverLocation);

// --- Deliveries ---
// Requires senderId in body
router.post('/deliveries', apiController.createDeliveryRequest);
// Applies multer middleware for file upload named 'paymentProofImage'
// Requires senderId in body
router.post('/deliveries/payment-proof',
    uploadPaymentProof.single('paymentProofImage'), // Apply multer middleware here
    apiController.submitPaymentProof
);
// Requires driverId and deliveryRequestId in body
router.post('/deliveries/accept', apiController.driverAcceptRequest);

// --- Admin Functions (Open Routes) ---
// Requires driver_id, status in body
router.put('/admin/drivers/approval', apiController.updateApproval);
// Requires delivery_id in body
router.post('/admin/payments/approve', apiController.adminApprovePayment);
// Supports query params for filtering/pagination
router.get('/admin/deliveries', apiController.getAllDeliveryRequests);
// Requires deliveryRequestId, driverId in body
router.post('/admin/deliveries/assign', apiController.adminAssignDriver);
// Requires deliveryRequestId, radiusKm in body
router.post('/admin/deliveries/broadcast', apiController.adminBroadcastRequest);

// --- Pricing ---
// Requires pricing params in body
router.put('/pricing', apiController.setOrUpdatePricing);
router.get('/pricing', apiController.getPricing);

export default router;
