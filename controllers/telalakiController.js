// controllers/telalakiController.js
// ------------- Unified Controller - INSECURE / OPEN ROUTES -------------

// --- Imports ---
import {
    Sender, Vehicle, Driver, AdminApproval, DeliveryRequest,
    DynamicPricing, Notification, sequelize, Sequelize
} from '../models/Telalaki.js'; // Adjust path as needed
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize'; // Required for complex queries like filtering/bounding box
import dotenv from 'dotenv';

dotenv.config(); // Ensure JWT_SECRET is loaded

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;
const MAX_ASSIGNMENT_DISTANCE_KM = 50; // Example constant for distance safeguard

// --- START HELPER FUNCTIONS (Included directly for consolidation) ---

/**
 * Sends a standardized error response.
 * @param {object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Error message for the client.
 * @param {object|array|null} [error=null] - Optional error details (Sequelize errors, etc.).
 */
const sendErrorResponse = (res, statusCode, message, error = null) => {
    console.error(`Error ${statusCode}: ${message}`, error ? error.message || error : ''); // Log the error server-side
    let details;
    // Try to extract specific validation errors from Sequelize
    if (error && error.name === 'SequelizeValidationError' && Array.isArray(error.errors)) {
         details = error.errors.map(e => ({ field: e.path, message: e.message }));
    } else if (error && Array.isArray(error) && error.length > 0 && error[0].message) { // Handle other array errors
        details = error.map(e => ({ field: e.path, message: e.message }));
    } else if (error && error.message) { // Handle single error object
         details = error.message;
    }
    return res.status(statusCode).json({
        message: message,
        error: details || (error ? 'An unexpected error occurred.' : undefined) // Avoid leaking sensitive details
    });
};

/**
 * Creates a notification record in the database.
 * @param {object} details - Notification details (sender_id OR driver_id, message, type, etc.).
 * @param {object|null} [transaction=null] - Optional Sequelize transaction object.
 */
const createNotification = async (details, transaction = null) => {
    try {
        if (!details.message || (!details.sender_id && !details.driver_id)) {
             console.error("Failed to create notification: Missing message or recipient ID", details);
             return;
        }
        await Notification.create(details, { transaction });
        console.log(`Notification created: ${details.type || 'general'} for ${details.sender_id ? 'Sender' : 'Driver'} ${details.sender_id || details.driver_id}`);
    } catch (notificationError) {
        // Log the error but don't let notification failure stop the main process
        console.error(`Failed to create notification (${details.type}):`, notificationError);
    }
};

/** Converts degrees to radians */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/** Converts radians to degrees */
function rad2deg(rad) {
  return rad * (180 / Math.PI);
}

/** Calculates the great-circle distance between two points using the Haversine formula. */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity; // Cannot calculate
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/** Calculates an approximate bounding box for geo-queries. */
function getBoundingBox(centerLat, centerLng, radiusKm) {
    const R = 6371;
    const latRad = deg2rad(centerLat);
    const latDelta = radiusKm / R;
    const minLat = rad2deg(latRad - latDelta);
    const maxLat = rad2deg(latRad + latDelta);
    if (minLat > -90 && maxLat < 90) {
        const lonDelta = Math.asin(Math.sin(latDelta) / Math.cos(latRad));
        const minLng = rad2deg(deg2rad(centerLng) - lonDelta);
        const maxLng = rad2deg(deg2rad(centerLng) + lonDelta);
        return { minLat, maxLat, minLng, maxLng };
    } else {
        // Handle poles or edge cases
        return { minLat: Math.max(minLat, -90), maxLat: Math.min(maxLat, 90), minLng: -180, maxLng: 180 };
    }
}
// --- END HELPER FUNCTIONS ---


// =============================================
// Authentication Functions
// =============================================

export const registerSender = async (req, res) => {
  try {
    const { full_name, phone, pin } = req.body;
    // Validation
    if (!full_name || !phone || !pin) return sendErrorResponse(res, 400, 'Full name, phone number, and 4-digit PIN are required.');
    if (!/^09\d{8}$/.test(phone)) return sendErrorResponse(res, 400, 'Invalid phone number format. Use 09xxxxxxxx format.');
    if (!/^\d{4}$/.test(pin)) return sendErrorResponse(res, 400, 'Sender PIN must be exactly 4 digits.');

    const existingSender = await Sender.findOne({ where: { phone } });
    if (existingSender) return sendErrorResponse(res, 409, 'Phone number is already registered.');

    const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);
    const sender = await Sender.create({ full_name, phone, pin: hashedPin });
    const senderData = { ...sender.toJSON() };
    delete senderData.pin; // Don't send hash back
    res.status(201).json({ message: 'Sender registered successfully.', sender: senderData });

  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
         return sendErrorResponse(res, 400, 'Registration failed: Validation or duplicate entry.', error.errors || error.message);
    }
    console.error('Sender Registration Error:', error);
    sendErrorResponse(res, 500, 'Sender registration failed due to an internal error.');
  }
};

export const loginSender = async (req, res) => {
    const { phone, pin } = req.body;
    // Validation
    if (!phone || !pin) return sendErrorResponse(res, 400, 'Phone number and PIN are required.');
    if (!/^09\d{8}$/.test(phone)) return sendErrorResponse(res, 400, 'Invalid phone number format.');
    if (!/^\d{4}$/.test(pin)) return sendErrorResponse(res, 400, 'Invalid PIN format. Must be 4 digits.');

    try {
        const sender = await Sender.findOne({ where: { phone } });
        if (!sender || !sender.pin) { // Check if sender exists and has a pin hash
            return sendErrorResponse(res, 401, 'Login failed: Invalid phone number or PIN.');
        }

        const isPinValid = await bcrypt.compare(pin, sender.pin);
        if (!isPinValid) {
            return sendErrorResponse(res, 401, 'Login failed: Invalid phone number or PIN.');
        }

        // Generate JWT (even though routes are open, login still provides a token)
        if (!JWT_SECRET) {
             console.error("FATAL ERROR: JWT_SECRET is not defined!");
             return sendErrorResponse(res, 500, 'Login failed due to server configuration error.');
        }
        const payload = { id: sender.id, phone: sender.phone, type: 'sender' };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        const senderData = { ...sender.toJSON() };
        delete senderData.pin;

        res.status(200).json({ message: 'Login successful.', accessToken, sender: senderData });
    } catch (err) {
        console.error("Sender Login Error:", err)
        sendErrorResponse(res, 500, 'Login failed due to an internal error.', err);
    }
};

export const registerDriver = async (req, res) => {
    const {
        sender_full_name, sender_phone, sender_pin,
        driver_full_name, driver_pin, driver_phone, driver_email, driver_region, driver_zone, driver_district, driver_house_number, driver_license_photo, identification_photo, is_owner,
        owner_full_name, region: vehicle_region, zone: vehicle_zone, district: vehicle_district, house_number: vehicle_house_number, phone: vehicle_phone, email: vehicle_email, car_type, car_name, manufacture_year, cargo_capacity, license_plate, commercial_license, tin_number, car_license_photo, owner_id_photo, car_photo, owner_photo
     } = req.body;

    let transaction;

    // --- Basic Input Validation ---
    if (!sender_full_name || !sender_phone || !sender_pin || !driver_full_name || !driver_pin) return sendErrorResponse(res, 400, 'Sender (name, phone, 4-digit PIN) and Driver (name, 6-digit PIN) required.');
    if (!/^\d{4}$/.test(sender_pin)) return sendErrorResponse(res, 400, 'Sender PIN must be 4 digits.');
    if (!/^\d{6}$/.test(driver_pin)) return sendErrorResponse(res, 400, 'Driver PIN must be 6 digits.');
    if (!/^09\d{8}$/.test(sender_phone)) return sendErrorResponse(res, 400, 'Invalid Sender phone format.');
    // Add more specific validation as needed (email, driver phone format if required)

    const driverIsOwner = is_owner === true || is_owner === 'true';
    if (!driverIsOwner && (!car_type || !license_plate /* Add other required vehicle fields */)) {
        return sendErrorResponse(res, 400, 'Vehicle info required if driver is not owner.');
    }

    try {
        transaction = await sequelize.transaction();

        const existingSender = await Sender.findOne({ where: { phone: sender_phone }, transaction });
        if (existingSender) {
             await transaction.rollback();
             return sendErrorResponse(res, 409, 'Sender phone number already registered.');
        }
        // Optional: Check if driver phone exists if it should be unique
        // const existingDriverPhone = await Driver.findOne({ where: { phone: driver_phone }, transaction });
        // if (driver_phone && existingDriverPhone) { /* rollback, 409 */ }

        // 1. Create Sender
        const hashedSenderPin = await bcrypt.hash(sender_pin, SALT_ROUNDS);
        const newSender = await Sender.create({ full_name: sender_full_name, phone: sender_phone, pin: hashedSenderPin }, { transaction });

        // 2. Create Driver
        const hashedDriverPin = await bcrypt.hash(driver_pin, SALT_ROUNDS);
        const driverData = {
            full_name: driver_full_name, phone: driver_phone, email: driver_email,
            region: driver_region, zone: driver_zone, district: driver_district, house_number: driver_house_number,
            driver_license_photo, identification_photo, is_owner: driverIsOwner, pin: hashedDriverPin,
            sender_id: newSender.id // Link to created Sender
        };
        const newDriver = await Driver.create(driverData, { transaction });

        // 3. Create Vehicle (if not owner)
        let newVehicle = null;
        if (!driverIsOwner) {
            const vehicleData = {
                owner_full_name, region: vehicle_region, zone: vehicle_zone, district: vehicle_district, house_number: vehicle_house_number,
                phone: vehicle_phone, email: vehicle_email, car_type, car_name, manufacture_year, cargo_capacity, license_plate,
                commercial_license, tin_number, car_license_photo, owner_id_photo, car_photo, owner_photo
                // Consider adding driver_id: newDriver.id if you add FK to Vehicle model
            };
             newVehicle = await Vehicle.create(vehicleData, { transaction });
        }

        // 4. Create AdminApproval
        await AdminApproval.create({ driver_id: newDriver.id, status: 'pending' }, { transaction });

        // 5. Create Notification
        await createNotification({
            sender_id: newSender.id, message: `Driver registration for ${driver_full_name} submitted, pending approval.`,
            type: 'driver_registration', related_entity_id: newDriver.id, related_entity_type: 'Driver'
        }, transaction);

        await transaction.commit();
        res.status(201).json({
            message: 'Driver registered successfully, pending approval.',
            driverId: newDriver.id, senderId: newSender.id, vehicleId: newVehicle ? newVehicle.id : null
        });

    } catch (err) {
        if (transaction) await transaction.rollback();
        if (err.name === 'SequelizeUniqueConstraintError') return sendErrorResponse(res, 409, `Registration failed: Duplicate value for ${err.errors?.[0]?.path || 'field'}.`);
        if (err.name === 'SequelizeValidationError') return sendErrorResponse(res, 400, 'Registration failed: Validation error.', err.errors);
        console.error("Driver Registration Error:", err);
        sendErrorResponse(res, 500, 'Driver registration failed.');
    }
};

export const loginDriver = async (req, res) => {
    const { phone, pin } = req.body;
    // Validation
    if (!phone || !pin) return sendErrorResponse(res, 400, 'Driver phone and 6-digit PIN required.');
    if (!/^09\d{8}$/.test(phone)) return sendErrorResponse(res, 400, 'Invalid phone number format.');
    if (!/^\d{6}$/.test(pin)) return sendErrorResponse(res, 400, 'Driver PIN must be 6 digits.');

    try {
        const driver = await Driver.findOne({
            where: { phone },
            include: [{ model: AdminApproval, as: 'approvalStatus', attributes: ['status'] }] // Include only status
        });

        if (!driver) return sendErrorResponse(res, 401, 'Login failed: Invalid credentials.');

        // Check approval status (provide info even if route is open)
        if (!driver.approvalStatus || driver.approvalStatus.status !== 'approved') {
             const status = driver.approvalStatus ? driver.approvalStatus.status : 'not processed';
             return sendErrorResponse(res, 403, `Login failed: Driver account is currently ${status}.`);
        }
        if (!driver.pin) {
             console.error(`Login Error: Driver ${driver.id} has no PIN hash.`);
             return sendErrorResponse(res, 500, 'Login failed: Server configuration error.');
        }

        const isPinValid = await bcrypt.compare(pin, driver.pin);
        if (!isPinValid) return sendErrorResponse(res, 401, 'Login failed: Invalid credentials.');

        if (!JWT_SECRET) {
             console.error("FATAL ERROR: JWT_SECRET is not defined!");
             return sendErrorResponse(res, 500, 'Login failed: Server configuration error.');
        }
        const payload = { id: driver.id, phone: driver.phone, type: 'driver' };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        const driverData = { ...driver.toJSON() };
        delete driverData.pin; // Exclude hash from response

        res.status(200).json({ message: 'Driver login successful.', accessToken, driver: driverData });
    } catch (err) {
         console.error("Driver Login Error:", err);
         sendErrorResponse(res, 500, 'Driver login failed.', err);
    }
};

// =============================================
// Driver Functions
// =============================================

export const updateDriverLocation = async (req, res) => {
    // !! INSECURE: driverId comes from URL param !!
    const { driverId } = req.params;
    const { latitude, longitude } = req.body;

    // Validation
    const drvId = parseInt(driverId, 10);
    if (isNaN(drvId) || drvId <= 0) return sendErrorResponse(res, 400, 'Invalid Driver ID in URL.');
    if (latitude === undefined || longitude === undefined) return sendErrorResponse(res, 400, 'Latitude and longitude required.');
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || !isFinite(lat) || lat < -90 || lat > 90) return sendErrorResponse(res, 400, 'Invalid latitude.');
    if (isNaN(lng) || !isFinite(lng) || lng < -180 || lng > 180) return sendErrorResponse(res, 400, 'Invalid longitude.');

    try {
        const driver = await Driver.findByPk(drvId);
        if (!driver) return sendErrorResponse(res, 404, `Driver with ID ${drvId} not found.`);

        // Update location fields
        driver.current_lat = lat;
        driver.current_lng = lng;
        driver.last_location_update = new Date();
        await driver.save();
        res.status(204).send(); // Success, no content

    } catch (err) {
        console.error(`Error updating location for driver ${drvId}:`, err);
        sendErrorResponse(res, 500, 'Failed to update driver location.', err);
    }
};

// =============================================
// Delivery Request Functions
// =============================================

export const createDeliveryRequest = async (req, res) => {
    // 1. Destructure 'vehicle' (expecting the NAME from frontend)
    const {
        senderId, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
        weight, size, quantity,
        vehicle, // <--- Expect 'vehicle' key containing the name
        payment_method,
    } = req.body;

    // --- Basic Input Validation ---

    // Sender ID Validation (slightly improved)
    const sId = parseInt(senderId, 10);
    if (!Number.isInteger(sId) || sId <= 0) {
        return sendErrorResponse(res, 400, 'Valid senderId (positive integer) is required in body.');
    }

    // Coordinate Presence Validation
    if (pickup_lat === undefined || pickup_lng === undefined || dropoff_lat === undefined || dropoff_lng === undefined) {
        return sendErrorResponse(res, 400, 'Pickup and Dropoff coordinates (latitude, longitude) are required.');
    }

    // Coordinate Type/Range Validation
    const validateCoord = (val, range) => (typeof val === 'number' && isFinite(val) && Math.abs(val) <= range);
    if (!validateCoord(pickup_lat, 90) || !validateCoord(pickup_lng, 180) || !validateCoord(dropoff_lat, 90) || !validateCoord(dropoff_lng, 180)) {
        return sendErrorResponse(res, 400, 'Invalid coordinate values or range.');
    }

    // Vehicle Name Validation (assuming required)
    if (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '') {
        return sendErrorResponse(res, 400, 'Vehicle name is required and must be a non-empty string.');
    }
     // Optional: Add a length check for vehicle name if needed
     // if (vehicle.length > 255) { // Example length limit
     //    return sendErrorResponse(res, 400, 'Vehicle name exceeds maximum length.');
     // }


    // Optional Fields Validation
    if (weight !== undefined && (typeof weight !== 'number' || !isFinite(weight) || weight <= 0)) {
        return sendErrorResponse(res, 400, 'If provided, weight must be a positive number.');
    }
    if (size !== undefined && (typeof size !== 'string' || size.trim() === '')) {
         return sendErrorResponse(res, 400, 'If provided, size must be a non-empty string.');
     }
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity <= 0)) {
        return sendErrorResponse(res, 400, 'If provided, quantity must be a positive integer.');
    }
     if (payment_method !== undefined && (typeof payment_method !== 'string' || payment_method.trim() === '')) {
         return sendErrorResponse(res, 400, 'If provided, payment_method must be a non-empty string.');
     }


    // --- Database Operations ---
    let transaction;
    try {
        transaction = await sequelize.transaction();

        // Check Sender existence
        const senderExists = await Sender.findByPk(sId, { transaction });
        if (!senderExists) {
            await transaction.rollback();
            // Use 404 Not Found for non-existent resource
            return sendErrorResponse(res, 404, `Sender with ID ${sId} not found.`);
        }

        // Fetch Pricing (Consider caching this if it rarely changes)
        const pricingConfig = await DynamicPricing.findByPk(1, { transaction }); // Assuming PK is 1
        // Check more thoroughly if pricing is usable
        if (!pricingConfig || typeof pricingConfig.price_per_km !== 'number' || !isFinite(pricingConfig.price_per_km) || pricingConfig.price_per_km < 0) {
            await transaction.rollback();
            console.warn(`Delivery creation blocked for Sender ${sId}: Pricing configuration invalid or missing.`);
            // Use 503 Service Unavailable if a core config is missing/bad
            return sendErrorResponse(res, 503, 'Service Unavailable: Pricing configuration error.');
        }

        // Calculate Distance (using Haversine)
        const distanceKm = calculateDistance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng);
        console.log(`Calculated distance for Sender ${sId}: ${distanceKm.toFixed(2)} km`);
        // Basic check for extremely short distances if needed
        // if (distanceKm < 0.01) { // e.g., less than 10 meters
        //     console.warn(`Potential issue: Very short distance calculated (${distanceKm} km)`);
        // }


        // Calculate Price (Server-side calculation is authoritative)
        let calculatedPrice = distanceKm * pricingConfig.price_per_km;
        // Apply other factors safely checking type and value
        if (weight && typeof pricingConfig.price_per_kg === 'number' && isFinite(pricingConfig.price_per_kg)) {
            calculatedPrice += weight * pricingConfig.price_per_kg;
        }
        if (quantity && typeof pricingConfig.price_per_quantity === 'number' && isFinite(pricingConfig.price_per_quantity)) {
             calculatedPrice += quantity * pricingConfig.price_per_quantity;
        }
        // Example: Add base fee if configured
        if (typeof pricingConfig.base_fee === 'number' && isFinite(pricingConfig.base_fee)) {
             calculatedPrice += pricingConfig.base_fee;
        }
        // Example: Apply minimum charge if configured
         if (typeof pricingConfig.minimum_charge === 'number' && isFinite(pricingConfig.minimum_charge) && calculatedPrice < pricingConfig.minimum_charge) {
             calculatedPrice = pricingConfig.minimum_charge;
         }
        // Ensure price is non-negative and round
        calculatedPrice = Math.max(0, calculatedPrice);
        calculatedPrice = Math.round(calculatedPrice * 100) / 100; // Round to 2 decimal places


        // Prepare Data object for creation
        // Ensure keys match EXACTLY with your Sequelize model definition and DB columns
        const deliveryData = {
            sender_id: sId,
            pickup_lat: pickup_lat,
            pickup_lng: pickup_lng,
            dropoff_lat: dropoff_lat,
            dropoff_lng: dropoff_lng,
            status: 'pending', // Initial status
            price: calculatedPrice, // Use server-calculated price
            vehicle: vehicle, // Add the vehicle name (assuming required)

            // Add optional fields only if they were provided and valid
            ...(weight !== undefined && { weight: weight }),
            ...(size !== undefined && { size: size }), // Assuming 'size' is the correct field name
            ...(quantity !== undefined && { quantity: quantity }),
            ...(payment_method !== undefined && { payment_method: payment_method }),
        };

        // Create the DeliveryRequest record
        console.log("Attempting to create DeliveryRequest with data:", deliveryData);
        const newDelivery = await DeliveryRequest.create(deliveryData, { transaction });

        // Create associated Notification
        try {
            await createNotification({
                sender_id: sId, // Link notification to the sender
                 message: `Request #${newDelivery.id} created successfully. Price: ${calculatedPrice.toFixed(2)} ETB. Searching for drivers...`, // Consider adding currency
                 type: 'delivery_created',
                 related_entity_id: newDelivery.id,
                 related_entity_type: 'DeliveryRequest'
             }, transaction);
        } catch (notificationError) {
            // Decide if notification failure should rollback the delivery creation
            // For now, just log it but proceed with delivery creation success
            console.error(`Failed to create notification for delivery ${newDelivery.id}:`, notificationError);
            // Optionally: await transaction.rollback(); throw notificationError;
        }


        // TODO: Trigger driver matching logic (asynchronously is best)
        // Example: dispatchDriverMatching(newDelivery.id); // Your async function
        console.log(`INFO: Delivery Request ${newDelivery.id} created by Sender ${sId}. Driver matching needs implementation.`);

        // Commit transaction if all steps successful
        await transaction.commit();

        // Return the created delivery object
        // Ensure sensitive data is not exposed if necessary (e.g., via model scopes)
        res.status(201).json(newDelivery);

    } catch (err) {
        // Rollback transaction on any error
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Error rolling back transaction:", rollbackError);
            }
        }

        // Handle specific errors
        if (err.name === 'SequelizeValidationError') {
            console.error("Sequelize Validation Error details:", err.errors);
            // Provide more specific validation feedback if possible
            return sendErrorResponse(res, 400, 'Creation failed: Validation error(s).', err.errors);
        }
        if (err.name === 'SequelizeForeignKeyConstraintError') {
             console.error("Foreign Key Constraint Error:", err);
             return sendErrorResponse(res, 400, 'Invalid reference provided (e.g., sender ID).');
         }

        // Generic internal server error for other cases
        console.error(`FATAL: Error creating delivery request for sender ${sId}:`, err);
        sendErrorResponse(res, 500, 'An unexpected error occurred while creating the delivery request.', err); // Avoid sending raw error in production
    }
};

export const submitPaymentProof = async (req, res) => {
    // !! INSECURE: Needs senderId in body !!
    const { delivery_id, senderId } = req.body;
    const uploadedFile = req.file; // From multer middleware

    // Validation
    const reqId = parseInt(delivery_id, 10);
    const sId = parseInt(senderId, 10);
    if (!reqId || !sId || isNaN(reqId) || isNaN(sId) || reqId <= 0 || sId <= 0) return sendErrorResponse(res, 400, 'Valid deliveryId and senderId required.');
    if (!uploadedFile) return sendErrorResponse(res, 400, 'Payment proof image file required.');

    // Construct URL path (ensure static serving is set up correctly in server.js)
    const filePathUrl = `/uploads/payment_proofs/${uploadedFile.filename}`;
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const delivery = await DeliveryRequest.findByPk(reqId, { transaction });
        if (!delivery) {
            await transaction.rollback();
            // Consider deleting uploaded file fs.unlink(uploadedFile.path, ...)
            return sendErrorResponse(res, 404, `Delivery request #${reqId} not found.`);
        }

        // Ownership Check (using senderId from body)
        if (delivery.sender_id !== sId) {
            await transaction.rollback();
            // Consider deleting uploaded file
            return sendErrorResponse(res, 403, 'Forbidden: You do not own this request.');
        }
        if (delivery.is_payment_approved) {
            await transaction.rollback();
             // Consider deleting uploaded file
            return sendErrorResponse(res, 400, `Payment for #${delivery.id} already approved.`);
        }

        // Update Record
        delivery.payment_method = 'screenshot';
        delivery.payment_proof_url = filePathUrl;
        delivery.receipt_link = null; // Clear other proof type
        delivery.is_payment_approved = false; // Pending review
        delivery.approved_by = null;
        await delivery.save({ transaction });

        // Notification
        await createNotification({
            sender_id: sId, message: `Payment proof image submitted for delivery #${delivery.id}. Pending review.`,
            type: 'payment_proof_submitted', related_entity_id: delivery.id, related_entity_type: 'DeliveryRequestPayment'
        }, transaction);

        await transaction.commit();
        res.status(200).json({ message: 'Payment proof submitted successfully.', filePath: filePathUrl });
    } catch (err) {
        if (transaction) await transaction.rollback();
        // Consider deleting uploaded file on DB error
        // if (uploadedFile?.path) { try { fs.unlinkSync(uploadedFile.path); } catch(e){...}}
        console.error(`Error submitting payment proof for Req ${delivery_id}:`, err);
        sendErrorResponse(res, 500, 'Failed to submit payment proof.', err);
    }
};

export const driverAcceptRequest = async (req, res) => {
    // !! INSECURE: Needs driverId in body !!
    const { deliveryRequestId, driverId } = req.body;

    // Validation
    const reqId = parseInt(deliveryRequestId, 10);
    const drvId = parseInt(driverId, 10);
    if (!reqId || !drvId || isNaN(reqId) || isNaN(drvId) || reqId <= 0 || drvId <= 0) return sendErrorResponse(res, 400, 'Valid deliveryRequestId and driverId required.');

    let transaction;
    try {
        // Attempt high isolation transaction if DB supports it, e.g., PostgreSQL
        transaction = await sequelize.transaction({
             // isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE // Example
        });

        // Lock rows if using pessimistic locking with DBs like PostgreSQL
        // const lockOption = { transaction, lock: transaction.LOCK.UPDATE };
        const lockOption = { transaction }; // Standard transaction lock

        // Fetch Request & Sender
        const deliveryRequest = await DeliveryRequest.findByPk(reqId, {
            include: [{ model: Sender, as: 'sender', attributes: ['id', 'full_name'] }],
             ...lockOption // Apply lock
        });

        if (!deliveryRequest) {
            await transaction.rollback();
            return sendErrorResponse(res, 404, `Delivery Request #${reqId} not found.`);
        }
        // Check Status - CRITICAL for race condition
        if (deliveryRequest.status !== 'broadcasting') {
             await transaction.rollback();
             const msg = deliveryRequest.assigned_driver_id ? `Request #${reqId} already assigned.` : `Request #${reqId} not available (Status: ${deliveryRequest.status}).`;
             return sendErrorResponse(res, 409, msg); // Conflict
        }

        // Fetch Driver & Check Status/Approval
        const driver = await Driver.findByPk(drvId, {
            include: [{ model: AdminApproval, as: 'approvalStatus' }],
             ...lockOption // Apply lock
        });

        if (!driver) { await transaction.rollback(); return sendErrorResponse(res, 404, `Driver ${drvId} not found.`); }
        if (!driver.approvalStatus || driver.approvalStatus.status !== 'approved') { await transaction.rollback(); return sendErrorResponse(res, 403, 'Account not approved.'); }
        if (!driver.is_available_for_new || driver.current_status !== 'idle') { await transaction.rollback(); return sendErrorResponse(res, 409, `Cannot accept: Your status is ${driver.current_status}.`); }

        // Update Records
        deliveryRequest.assigned_driver_id = drvId;
        deliveryRequest.status = 'driver_confirmed';
        await deliveryRequest.save({ transaction });

        driver.is_available_for_new = false;
        driver.current_status = 'en_route_pickup';
        await driver.save({ transaction });

        // Notifications
        await createNotification({ driver_id: drvId, message: `✅ Accepted Delivery Request #${reqId}. Proceed to pickup.`, type: 'request_accepted_self', related_entity_id: reqId, related_entity_type: 'DeliveryRequest'}, transaction);
        if (deliveryRequest.sender) { await createNotification({ sender_id: deliveryRequest.sender.id, message: `Driver ${driver.full_name} accepted Request #${reqId}!`, type: 'request_accepted_sender', related_entity_id: reqId, related_entity_type: 'DeliveryRequest'}, transaction); }
        // Optional TODO: Notify other broadcasted drivers

        await transaction.commit();
        res.status(200).json({ message: `Request #${reqId} accepted successfully.`, deliveryRequest });

    } catch (err) {
        if (transaction) await transaction.rollback();
         if (err.name === 'SequelizeTimeoutError' || err.message.includes('lock')) {
            console.warn(`Lock contention accepting Req ${deliveryRequestId} by Drv ${driverId}:`, err);
            return sendErrorResponse(res, 503, 'Could not process acceptance now. Please try again.');
         }
        console.error(`Error accepting request ${deliveryRequestId} by driver ${driverId}:`, err);
        sendErrorResponse(res, 500, 'Failed to accept delivery request.', err);
    }
};


// =============================================
// Admin Functions (Open Routes)
// =============================================

export const updateApproval = async (req, res) => {
    const { driver_id, status, reason } = req.body;
    // Validation
    if (!driver_id || !status) return sendErrorResponse(res, 400, 'driver_id and status required.');
    const drvId = parseInt(driver_id, 10);
    if (isNaN(drvId) || drvId <= 0) return sendErrorResponse(res, 400, 'Invalid driver_id.');
    if (!['approved', 'rejected'].includes(status)) return sendErrorResponse(res, 400, 'Invalid status.');
    if (status === 'rejected' && !reason) return sendErrorResponse(res, 400, 'Reason required for rejection.');

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const approval = await AdminApproval.findOne({
            where: { driver_id: drvId },
            include: [{ model: Driver, as: 'driver', include: [{ model: Sender, as: 'senderAccount' }] }],
            transaction
        });
        if (!approval) { await transaction.rollback(); return sendErrorResponse(res, 404, `Approval record not found for driver ${drvId}.`); }
        if (approval.status === status) { await transaction.rollback(); return res.status(200).json({ message: `Driver status already ${status}.` }); }

        const driver = approval.driver;
        const sender = driver?.senderAccount;
        const originalStatus = approval.status;

        // Update Approval
        approval.status = status;
        approval.approved_at = status === 'approved' ? new Date() : null;
        approval.rejected_reason = status === 'rejected' ? reason : null;
        await approval.save({ transaction });

        // Update Driver Status
        if (driver) {
             driver.current_status = status === 'approved' ? 'idle' : 'offline';
             driver.is_available_for_new = status === 'approved';
             await driver.save({ transaction });
        }
        // Notification
        let notificationMessage = '';
         if (status === 'approved' && originalStatus !== 'approved') notificationMessage = `Driver profile for ${driver?.full_name} approved.`;
         else if (status === 'rejected' && originalStatus !== 'rejected') notificationMessage = `Driver profile for ${driver?.full_name} rejected. Reason: ${reason}`;

        if (notificationMessage && sender) {
            await createNotification({ sender_id: sender.id, message: notificationMessage, type: 'driver_approval_update', related_entity_id: drvId, related_entity_type: 'DriverApproval'}, transaction);
        } else if (!sender && driver) {
             console.warn(`Could not send approval notification: Sender not found for Driver ID ${drvId}`);
        }

        await transaction.commit();
        res.status(200).json({ message: `Driver ${drvId} status updated to ${status}.` });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error(`Error updating approval for driver ${driver_id}:`, err);
        sendErrorResponse(res, 500, 'Failed to update driver approval.', err);
    }
};

export const adminApprovePayment = async (req, res) => {
    const { delivery_id } = req.body;
    // Validation
    if (!delivery_id) return sendErrorResponse(res, 400, 'Delivery ID required.');
    const reqId = parseInt(delivery_id, 10);
    if (isNaN(reqId) || reqId <= 0) return sendErrorResponse(res, 400, 'Invalid Delivery ID.');

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const delivery = await DeliveryRequest.findByPk(reqId, { include: [{ model: Sender, as: 'sender' }], transaction });
        if (!delivery) { await transaction.rollback(); return sendErrorResponse(res, 404, `Delivery request #${reqId} not found.`); }

        // Business Checks
        if (delivery.payment_method !== 'screenshot') { await transaction.rollback(); return sendErrorResponse(res, 400, 'Admin approval only applicable for screenshot payments.'); }
        if (!delivery.payment_proof_url) { await transaction.rollback(); return sendErrorResponse(res, 400, 'No payment proof URL found for this delivery.'); }
        if (delivery.is_payment_approved) { await transaction.rollback(); return sendErrorResponse(res, 409, `Payment for #${delivery.id} already approved by ${delivery.approved_by || 'N/A'}.`); }

        // Update Record
        delivery.is_payment_approved = true;
        delivery.approved_by = 'admin';
        await delivery.save({ transaction });

        // Notification
        await createNotification({ sender_id: delivery.sender_id, message: `Admin approved payment for delivery #${delivery.id}.`, type: 'payment_approved_admin', related_entity_id: delivery.id, related_entity_type: 'DeliveryRequestPayment'}, transaction);

        await transaction.commit();
        res.status(200).json({ message: `Payment for delivery #${reqId} approved by admin.` });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error(`Error admin approving payment for Req ${delivery_id}:`, err);
        sendErrorResponse(res, 500, 'Failed to approve payment.', err);
    }
};

export const getAllDeliveryRequests = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;

        // Filtering
        const whereClause = {};
        if (req.query.status) whereClause.status = { [Op.in]: req.query.status.split(',').map(s => s.trim()) };
        if (req.query.senderId) whereClause.sender_id = parseInt(req.query.senderId, 10);
        if (req.query.driverId) whereClause.assigned_driver_id = parseInt(req.query.driverId, 10);
        // Add date range filters etc. if needed

        // Sorting
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const orderClause = [[sortBy, sortOrder]];

        // Fetch Data
        const { count, rows } = await DeliveryRequest.findAndCountAll({
            where: whereClause,
            include: [
                { model: Sender, as: 'sender', attributes: ['id', 'full_name', 'phone'] },
                { model: Driver, as: 'assignedDriver', attributes: ['id', 'full_name', 'phone', 'current_lat', 'current_lng'] }
            ],
            order: orderClause,
            limit: limit,
            offset: offset,
            distinct: true,
        });

        // Prepare Response
        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            message: "Delivery requests retrieved.",
            data: rows,
            pagination: { totalItems: count, totalPages, currentPage: page, limit }
        });
    } catch (err) {
        if (err instanceof TypeError || err instanceof Error && err.message.includes("parseInt")) {
             return sendErrorResponse(res, 400, 'Invalid query parameter format.', err);
        }
        console.error("Error fetching delivery requests:", err);
        sendErrorResponse(res, 500, 'Failed to retrieve delivery requests.', err);
    }
};

export const adminAssignDriver = async (req, res) => {
    const { deliveryRequestId, driverId } = req.body;
    // Validation
    if (!deliveryRequestId || !driverId) return sendErrorResponse(res, 400, 'deliveryRequestId and driverId required.');
    const reqId = parseInt(deliveryRequestId, 10);
    const drvId = parseInt(driverId, 10);
    if (isNaN(reqId) || isNaN(drvId) || reqId <= 0 || drvId <= 0) return sendErrorResponse(res, 400, 'Invalid IDs.');

    let transaction;
    try {
        transaction = await sequelize.transaction();

        // Fetch Request
        const deliveryRequest = await DeliveryRequest.findByPk(reqId, { include: [{ model: Sender, as: 'sender' }], transaction });
        if (!deliveryRequest) { await transaction.rollback(); return sendErrorResponse(res, 404, `Request #${reqId} not found.`); }
        if (deliveryRequest.status !== 'pending') { await transaction.rollback(); return sendErrorResponse(res, 400, `Request #${reqId} status is not 'pending'.`); }

        // Fetch Driver & Checks
        const driver = await Driver.findByPk(drvId, { include: [{ model: AdminApproval, as: 'approvalStatus' }], transaction });
        if (!driver) { await transaction.rollback(); return sendErrorResponse(res, 404, `Driver ${drvId} not found.`); }
        if (!driver.approvalStatus || driver.approvalStatus.status !== 'approved') { await transaction.rollback(); return sendErrorResponse(res, 400, `Driver ${drvId} not approved.`); }
        if (!['idle', 'offline'].includes(driver.current_status) || !driver.is_available_for_new) { await transaction.rollback(); return sendErrorResponse(res, 400, `Driver ${drvId} not available.`); }

        // Optional Distance Check
        if (driver.current_lat && deliveryRequest.pickup_lat) {
            const distance = calculateDistance(driver.current_lat, driver.current_lng, deliveryRequest.pickup_lat, deliveryRequest.pickup_lng);
            console.log(`AdminAssign: Dist Drv ${drvId} to Req ${reqId} Pickup: ${distance.toFixed(1)}km`);
            if (distance > MAX_ASSIGNMENT_DISTANCE_KM) {
                await transaction.rollback();
                return sendErrorResponse(res, 400, `Assignment failed safeguard: Driver ${distance.toFixed(1)} km away.`);
            }
        }

        // Update Records
        deliveryRequest.assigned_driver_id = drvId;
        deliveryRequest.status = 'assigned';
        await deliveryRequest.save({ transaction });
        driver.is_available_for_new = false;
        driver.current_status = 'assigned';
        await driver.save({ transaction });

        // Notifications
        await createNotification({ driver_id: drvId, message: `Admin assigned you Delivery #${reqId}.`, type: 'assignment_admin', related_entity_id: reqId, related_entity_type: 'DeliveryRequest'}, transaction);
        if (deliveryRequest.sender) { await createNotification({ sender_id: deliveryRequest.sender.id, message: `Admin assigned Driver ${driver.full_name} to Request #${reqId}.`, type: 'driver_assigned', related_entity_id: reqId, related_entity_type: 'DeliveryRequest'}, transaction); }

        await transaction.commit();
        res.status(200).json({ message: `Driver ${drvId} assigned to Request ${reqId}.`, deliveryRequest });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error(`Error admin assigning driver ${driverId} to request ${deliveryRequestId}:`, err);
        sendErrorResponse(res, 500, 'Failed to assign driver.', err);
    }
};

export const adminBroadcastRequest = async (req, res) => {
    const { deliveryRequestId, radiusKm } = req.body;
    // Validation
    if (!deliveryRequestId || !radiusKm) return sendErrorResponse(res, 400, 'deliveryRequestId and radiusKm required.');
    const reqId = parseInt(deliveryRequestId, 10);
    const radius = parseFloat(radiusKm);
    if (isNaN(reqId) || isNaN(radius) || reqId <= 0 || radius <= 0) return sendErrorResponse(res, 400, 'Invalid ID or radius.');

    let transaction;
    try {
        transaction = await sequelize.transaction();

        // Fetch Request
        const deliveryRequest = await DeliveryRequest.findByPk(reqId, { transaction });
        if (!deliveryRequest) { await transaction.rollback(); return sendErrorResponse(res, 404, `Request #${reqId} not found.`); }
        if (deliveryRequest.status !== 'pending') { await transaction.rollback(); return sendErrorResponse(res, 400, `Cannot broadcast: Request status is '${deliveryRequest.status}'.`); }
        if (!deliveryRequest.pickup_lat || !deliveryRequest.pickup_lng) { await transaction.rollback(); return sendErrorResponse(res, 400, `Request #${reqId} missing pickup coordinates.`); }

        // Find Eligible Drivers
        const { pickup_lat, pickup_lng } = deliveryRequest;
        const boundingBox = getBoundingBox(pickup_lat, pickup_lng, radius);
        const potentialDrivers = await Driver.findAll({
            where: {
                is_available_for_new: true, current_status: 'idle',
                current_lat: { [Op.between]: [boundingBox.minLat, boundingBox.maxLat] },
                current_lng: { [Op.between]: [boundingBox.minLng, boundingBox.maxLng] },
            },
            include: [{ model: AdminApproval, as: 'approvalStatus', where: { status: 'approved' }, required: true }],
            attributes: ['id', 'full_name', 'current_lat', 'current_lng'],
            transaction
        });
        const driversInRadius = potentialDrivers.filter(driver => {
            if (!driver.current_lat || !driver.current_lng) return false;
            const distance = calculateDistance(pickup_lat, pickup_lng, driver.current_lat, driver.current_lng);
            return distance <= radius;
        });
        if (driversInRadius.length === 0) { await transaction.rollback(); return sendErrorResponse(res, 404, `No available drivers found within ${radius} km.`); }

        // Update Request Status
        deliveryRequest.status = 'broadcasting';
        await deliveryRequest.save({ transaction });

        // Create Notifications
        const notificationPromises = driversInRadius.map(driver => {
            const distance = calculateDistance(pickup_lat, pickup_lng, driver.current_lat, driver.current_lng);
            return createNotification({
                driver_id: driver.id, message: `New Delivery #${reqId} available approx ${distance.toFixed(1)} km away. Accept Now!`,
                type: 'broadcast_request', related_entity_id: reqId, related_entity_type: 'DeliveryRequest'
            }, transaction);
        });
        await Promise.all(notificationPromises);

        await transaction.commit();
        res.status(200).json({ message: `Request #${reqId} broadcasted to ${driversInRadius.length} drivers.`, broadcastedTo: driversInRadius.map(d => d.id) });

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error(`Error broadcasting request ${deliveryRequestId}:`, err);
        sendErrorResponse(res, 500, 'Failed to broadcast request.', err);
    }
};

// =============================================
// Pricing Functions (Open Routes)
// =============================================

export const setOrUpdatePricing = async (req, res) => {
    // Validation
    const { price_per_km, price_per_kg, price_per_size_unit, price_per_quantity } = req.body;
    const updateData = {};
    if (price_per_km !== undefined && !isNaN(parseFloat(price_per_km)) && isFinite(price_per_km)) updateData.price_per_km = parseFloat(price_per_km);
    if (price_per_kg !== undefined && !isNaN(parseFloat(price_per_kg)) && isFinite(price_per_kg)) updateData.price_per_kg = parseFloat(price_per_kg);
    if (price_per_size_unit !== undefined && !isNaN(parseFloat(price_per_size_unit)) && isFinite(price_per_size_unit)) updateData.price_per_size_unit = parseFloat(price_per_size_unit);
    if (price_per_quantity !== undefined && !isNaN(parseFloat(price_per_quantity)) && isFinite(price_per_quantity)) updateData.price_per_quantity = parseFloat(price_per_quantity);

    if (Object.keys(updateData).length === 0) return sendErrorResponse(res, 400, 'At least one valid pricing parameter required.');

    try {
        // Upsert the single pricing row (ID 1)
        const [pricing, created] = await DynamicPricing.upsert({ id: 1, ...updateData }, { returning: true });
        res.status(200).json({ message: `Pricing config ${created ? 'created' : 'updated'}.`, pricing });
    } catch (err) {
        if (err.name === 'SequelizeValidationError') return sendErrorResponse(res, 400, 'Pricing update failed: Validation.', err.errors);
        console.error("Error updating pricing:", err);
        sendErrorResponse(res, 500, 'Failed to update pricing.', err);
    }
};

export const getPricing = async (req, res) => {
    try {
        const pricing = await DynamicPricing.findByPk(1); // Assumes ID 1 for global config
        if (!pricing) return sendErrorResponse(res, 404, 'Pricing configuration not found.');

        const pricingData = { ...pricing.toJSON() };
        delete pricingData.id; // Hide internal ID
        res.status(200).json({ message: "Pricing configuration retrieved.", pricing: pricingData });
    } catch (err) {
        console.error("Error getting pricing:", err);
        sendErrorResponse(res, 500, 'Failed to retrieve pricing.', err);
    }
};
