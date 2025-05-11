// routes/telalakiRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as apiController from '../controllers/telalakiController.js';
// እንደአስፈላጊነቱ የፋይል ዱካውን ያስተካክሉ

const router = express.Router();

console.log("--- Telalaki API Routes Initializing (WARNING: OPEN ROUTES!) ---");

// --- START MULTER CONFIGURATION (Integrated into router file) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads/payment_proofs'); // የዱካውን ትክክለኛነት ያረጋግጡ

// የመጫኛ ፎልደር መኖሩን ያረጋግጡ
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory: ${uploadDir}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // ኦሪጅናል የፋይል ስም ላይ ያሉ ክፍተቶችን በ "_" መተካት
        const originalNameSafe = file.originalname.replace(/\s+/g, '_');
        const extension = path.extname(originalNameSafe);
        // 'payment_proof_file' በ frontend ላይ ካለው የ input field name ጋር መመሳሰል አለበት
        cb(null, 'payment_proof_file' + '-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    // የሚፈቀዱ የፋይል አይነቶችን ማረጋገጥ
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        // ስህተት በሚፈጠርበት ጊዜ cb(new Error(...)) መጠቀም የተሻለ ነው
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, PDF allowed.'), false);
    }
};

const uploadPaymentProof = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 10 } // 10MB ገደብ (እንደአስፈላጊነቱ ያስተካክሉ)
});
// --- END MULTER CONFIGURATION ---


// --- Authentication ---
router.post('/auth/register/sender', apiController.registerSender);
router.post('/auth/login/sender', apiController.loginSender);
router.post('/auth/register/driver', apiController.registerDriver); // ይህ ብዙ ዳታ ስለሚቀበል የ body parser limit ን ማረጋገጥ ጥሩ ነው
router.post('/auth/login/driver', apiController.loginDriver);
router.get(
    '/notifications/my',
    // protectSender, // የማንነት ማረጋገጫ middleware እዚህ ጋር መጨመር አለበት
    apiController.getMyNotifications
);

// --- Drivers ---
// :driverId የ URL parameter ይጠቀማል
router.put('/drivers/:driverId/location', apiController.updateDriverLocation); // የማንነት ማረጋገጫ ያስፈልገዋል

// --- Deliveries ---
// አዲስ የመላኪያ ጥያቄ ለመፍጠር (ከአማራጭ የክፍያ ማረጋገጫ ምስል ጋር)
// Multer middleware 'payment_proof_file' ለተባለው መስክ ይተገበራል
router.post('/deliveries',
    uploadPaymentProof.single('payment_proof_file'), // Multer middleware ለፋይል ጭነት
    apiController.createDeliveryRequest
);

// <<<< ይሰረዝ፡ የድሮው የተለየ የክፍያ ማረጋገጫ ራውት >>>>
// router.post('/deliveries/payment-proof',
//     uploadPaymentProof.single('paymentProofImage'), // የድሮው የመስክ ስም ነበር
//     apiController.submitPaymentProof // ይህ ፈንክሽን አሁን createDeliveryRequest ውስጥ ተዋህዷል
// );

// driverId እና deliveryRequestId በ body ውስጥ ያስፈልጋል
router.post('/deliveries/accept', apiController.driverAcceptRequest); // የማንነት ማረጋገጫ ያስፈልገዋል

// --- Admin Functions (Open Routes - !! ደህንነታቸውን ያረጋግጡ !!) ---
// driver_id, status በ body ውስጥ ያስፈልጋል
router.put('/admin/drivers/approval', apiController.updateApproval);
// delivery_id በ body ውስጥ ያስፈልጋል
router.post('/admin/payments/approve', apiController.adminApprovePayment);
// የማጣሪያ/የገጽ ቁጥር query params ይደግፋል
router.get('/admin/deliveries', apiController.getAllDeliveryRequests);
// deliveryRequestId, driverId በ body ውስጥ ያስፈልጋል
router.post('/admin/deliveries/assign', apiController.adminAssignDriver);
// deliveryRequestId, radiusKm በ body ውስጥ ያስፈልጋል
router.post('/admin/deliveries/broadcast', apiController.adminBroadcastRequest);
router.post('/register/shufer',apiController.registerShufer);
router.post('/login/shufer',apiController.loginShufer)
// --- Pricing ---
// የዋጋ መለኪያዎች በ body ውስጥ ያስፈልጋሉ
router.put('/pricing', apiController.setOrUpdatePricing); // የአስተዳዳሪ ጥበቃ ያስፈልገዋል
router.get('/pricing', apiController.getPricing);


// አጠቃላይ የ Multer ስህተት አያያዝ (ከሁሉም ራውቶች በኋላ ቢቀመጥ ይመረጣል)
// ይህንን በዋናው app.js ፋይልዎ ላይ ማስቀመጥ ይችላሉ ወይም እዚሁ መጨረሻ ላይ
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // ከ Multer የመጣ ስህተት (ለምሳሌ የፋይል መጠን ገደብ ማለፍ)
        console.error("Multer Error:", err);
        return res.status(400).json({ message: `File upload error: ${err.message}`, error: { field: err.field } });
    } else if (err && err.message && err.message.includes('Invalid file type')) {
        // ከ fileFilter የመጣ ብጁ ስህተት
        console.error("File Type Error:", err.message);
        return res.status(400).json({ message: err.message });
    } else if (err) {
        // ሌላ ያልታወቀ ስህተት
        console.error("Unknown Middleware Error:", err);
        return res.status(500).json({ message: "An unexpected error occurred." });
    }
    next();
});


export default router;
