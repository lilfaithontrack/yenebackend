import db from '../models/Telalaki.js'; // Assuming Telalaki.js correctly exports sequelize instance and models
import { Sequelize } from 'sequelize'; // Import Sequelize for Op and transaction
import bcrypt from 'bcrypt'; // For hashing PINs
import jwt from 'jsonwebtoken'; // For generating login tokens

// Destructure models and the sequelize instance
const { Sender, Vehicle, Driver, AdminApproval, DeliveryRequest, DynamicPricing, Notification, sequelize } = db;
const Op = Sequelize.Op; // Useful for complex queries

const JWT_SECRET = process.env.JWT_SECRET; // Load secret from environment variables
const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

// --- Helper Function for Notifications (to avoid repetition) ---
const createNotification = async (details, transaction = null) => {
    // details should contain: sender_id OR driver_id, message, type, related_entity_id, related_entity_type
    try {
        await Notification.create(details, { transaction }); // Pass transaction if provided
        console.log(`Notification created successfully: ${details.type} for ${details.sender_id ? 'Sender' : 'Driver'} ${details.sender_id || details.driver_id}`);
    } catch (notificationError) {
        // Log the error but don't let notification failure stop the main process
        console.error(`Failed to create notification (${details.type}):`, notificationError);
    }
};

// --- Helper for Error Responses ---
const sendErrorResponse = (res, statusCode, message, error = null) => {
    console.error(`Error ${statusCode}: ${message}`, error ? error.message || error : ''); // Log the error server-side
    // Extract specific validation errors if available
    let details;
    if (error && Array.isArray(error) && error.length > 0 && error[0].message) {
        details = error.map(e => ({ field: e.path, message: e.message }));
    } else if (error && error.message) {
         details = error.message;
    }

    return res.status(statusCode).json({
        message: message,
        error: details || (error ? 'An unexpected error occurred.' : undefined) // Avoid leaking sensitive details in production
    });
};

// =============================================
// Sender Authentication
// =============================================

export const registerSender = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;

    const existingSender = await Sender.findOne({ where: { phoneNumber } });
    if (existingSender) {
      return res.status(409).json({ message: 'Sender already registered.' });
    }

    const sender = await Sender.create({ fullName, phoneNumber });
    res.status(201).json({ message: 'Sender registered successfully.', sender });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      message: 'Sender registration failed due to an internal error.',
      error: error.message,
    });
  }
};


export const loginSender = async (req, res) => {
    const { phone, pin } = req.body;

    // --- Basic Input Validation ---
    if (!phone || !pin) {
        return sendErrorResponse(res, 400, 'Phone number and PIN are required.');
    }
     // Optional: Basic phone format check on login too
     if (!/^09\d{8}$/.test(phone)) {
         return sendErrorResponse(res, 400, 'Invalid phone number format.');
     }

    try {
        // Find the sender by phone number
        // IMPORTANT: Explicitly include the 'pin' attribute if you have default scopes excluding it.
        const sender = await Sender.findOne({
             where: { phone },
             attributes: ['id', 'full_name', 'phone', 'pin', 'createdAt', 'updatedAt'] // Ensure pin is selected
        });

        if (!sender) {
            // Use a generic message to avoid revealing if the phone number exists or not
            return sendErrorResponse(res, 401, 'Login failed: Invalid phone number or PIN.');
        }

        // Compare the provided PIN with the stored hash
        const isPinValid = await bcrypt.compare(pin, sender.pin);

        if (!isPinValid) {
            // Generic message again
            return sendErrorResponse(res, 401, 'Login failed: Invalid phone number or PIN.');
        }

        // --- Login Successful - Generate JWT ---
        if (!JWT_SECRET) {
             console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables!");
             return sendErrorResponse(res, 500, 'Login failed due to server configuration error.');
        }

        const payload = {
            id: sender.id,
            phone: sender.phone,
            type: 'sender' // Add a type to distinguish sender tokens from driver tokens if needed
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '1d' // Token expires in 1 day (adjust as needed)
        });

        // Exclude PIN from the response sender object
        const senderData = { ...sender.toJSON() };
        delete senderData.pin;

        return res.status(200).json({
            message: 'Login successful.',
            accessToken,
            sender: senderData
        });

    } catch (err) {
        // Generic internal server error
        return sendErrorResponse(res, 500, 'Login failed due to an internal error.', err);
    }
};


// =============================================
// Driver Registration and Approval
// =============================================

export const registerDriver = async (req, res) => {
    const { sender, driver, vehicle } = req.body; // Sender here includes full_name, phone, and the *4-digit* PIN
    let transaction;

    // --- Basic Input Validation ---
    if (!sender || !sender.phone || !sender.pin || !sender.full_name || !driver || !driver.full_name || !driver.pin) {
        return sendErrorResponse(res, 400, 'Sender (name, phone, 4-digit PIN) and Driver (name, 6-digit PIN) information are required.');
    }
    // Sender PIN validation
     if (!/^\d{4}$/.test(sender.pin)) {
         return sendErrorResponse(res, 400, 'Sender PIN must be exactly 4 digits.');
     }
    // Driver PIN validation
    if (!/^\d{6}$/.test(driver.pin)) {
         return sendErrorResponse(res, 400, 'Driver PIN must be exactly 6 digits.');
     }
    // Phone validation
    if (!/^09\d{8}$/.test(sender.phone)) {
         return sendErrorResponse(res, 400, 'Invalid Sender phone number format. Use 09xxxxxxxx format.');
    }
    // Add check for driver phone format if it differs or is also required
    // ...

    if (driver.is_owner === false && !vehicle) {
         return sendErrorResponse(res, 400, 'Vehicle information is required if the driver is not the owner.');
    }
    // TODO: Add more specific validation (e.g., email format) using a library like Joi

    try {
        transaction = await sequelize.transaction(); // Start transaction

        // Check if sender phone already exists
        const existingSender = await Sender.findOne({ where: { phone: sender.phone }, transaction });
        if (existingSender) {
             await transaction.rollback();
             return sendErrorResponse(res, 409, 'Sender phone number is already registered.');
        }
        // Check if driver phone already exists (if driver phone is unique)
        // const existingDriverPhone = await Driver.findOne({ where: { phone: driver.phone }, transaction });
        // if (existingDriverPhone) {
        //      await transaction.rollback();
        //      return sendErrorResponse(res, 409, 'Driver phone number is already registered.');
        // }

        // 1. Hash PINs and Create Sender
        const hashedSenderPin = await bcrypt.hash(sender.pin, SALT_ROUNDS);
        const newSender = await Sender.create({
             full_name: sender.full_name,
             phone: sender.phone,
             pin: hashedSenderPin
        }, { transaction });

        // 2. Hash Driver PIN and Create Driver, linking to Sender
        const hashedDriverPin = await bcrypt.hash(driver.pin, SALT_ROUNDS);
        const newDriver = await Driver.create({
            ...driver,
            pin: hashedDriverPin, // Store hashed driver pin
            sender_id: newSender.id,
        }, { transaction });

        // 3. Create Vehicle (if applicable)
        if (driver.is_owner === false && vehicle) {
            // TODO: Consider adding driver_id or sender_id FK to Vehicle model for better association
            await Vehicle.create({
                ...vehicle,
                // driver_id: newDriver.id, // Example if FK is added
            }, { transaction });
        }

        // 4. Create initial AdminApproval record
        await AdminApproval.create({ driver_id: newDriver.id }, { transaction });

        // 5. Create Notification for Sender
        await createNotification({
            sender_id: newSender.id,
            message: `Your driver registration is submitted and pending approval.`,
            type: 'driver_registration',
            related_entity_id: newDriver.id,
            related_entity_type: 'Driver'
        }, transaction); // Pass transaction

        // If all successful, commit the transaction
        await transaction.commit();

        return res.status(201).json({
            message: 'Driver registered successfully and pending approval.',
            driverId: newDriver.id,
            senderId: newSender.id
        });

    } catch (err) {
        // If transaction was started, roll it back
        if (transaction) await transaction.rollback();

        // Handle specific errors
        if (err.name === 'SequelizeUniqueConstraintError') {
            // Extract field name if possible, otherwise give generic message
            const field = err.errors && err.errors.length > 0 ? err.errors[0].path : 'field';
            return sendErrorResponse(res, 409, `Registration failed. The ${field} provided might already be in use.`);
        }
        if (err.name === 'SequelizeValidationError') {
             return sendErrorResponse(res, 400, 'Registration failed due to validation errors.', err.errors);
        }
        // Generic internal server error
        return sendErrorResponse(res, 500, 'Driver registration failed due to an internal error.', err);
    }
};

// ... (Keep the rest of your existing controller functions: updateApproval, payment handling, delivery creation, pricing etc.)
export const updateApproval = async (req, res) => {
    // --- Authorization ---
    // TODO: Implement middleware to check if req.user is an admin
    // if (req.user.role !== 'admin') return sendErrorResponse(res, 403, 'Unauthorized: Admin access required.');

    const { driver_id, status, reason } = req.body;
    let transaction;

    // --- Validation ---
    if (!driver_id || !status) {
        return sendErrorResponse(res, 400, 'Missing required fields: driver_id and status are required.');
    }
    if (!['approved', 'rejected'].includes(status)) {
         return sendErrorResponse(res, 400, 'Invalid status. Must be "approved" or "rejected".');
    }
    if (status === 'rejected' && !reason) {
        return sendErrorResponse(res, 400, 'Reason is required when rejecting a driver.');
    }

    try {
        transaction = await sequelize.transaction();

        // Find approval record, including associated Driver and Sender for notification
        const approval = await AdminApproval.findOne({
            where: { driver_id },
            include: [{
                model: Driver,
                required: true, // Ensure driver exists
                include: [{
                    model: Sender,
                    required: true // Ensure sender exists
                }]
            }],
            transaction // Lock the row during transaction
        });

        if (!approval) {
            await transaction.rollback(); // Rollback since we didn't find the record
            return sendErrorResponse(res, 404, `Approval record not found for driver ID ${driver_id}.`);
        }

        // Avoid redundant updates
        if (approval.status === status) {
             await transaction.rollback();
             return res.status(200).json({ message: `Driver status is already ${status}. No changes made.` });
        }

        const originalStatus = approval.status;

        // Update approval record
        approval.status = status;
        approval.approved_at = status === 'approved' ? new Date() : null;
        approval.rejected_reason = status === 'rejected' ? reason : null;
        await approval.save({ transaction });

        // --- Optional: Update Driver's status upon approval ---
        if (status === 'approved') {
             // Find the driver again within the transaction to update
             const driver = approval.Driver; // Already fetched via include
             if (driver) {
                 driver.current_status = 'idle'; // Set initial status
                 driver.is_available_for_new = true;
                 await driver.save({ transaction });
             }
        }
        // ----------------------------------------------------

        // Notify the Sender
        let notificationMessage = '';
        if (status === 'approved' && originalStatus !== 'approved') {
            notificationMessage = `Congratulations! Your driver profile (ID: ${driver_id}) has been approved. You can now receive delivery requests.`;
        } else if (status === 'rejected' && originalStatus !== 'rejected') {
            notificationMessage = `Your driver profile (ID: ${driver_id}) registration was rejected. Reason: ${reason}`;
        }

        if (notificationMessage) {
            await createNotification({
                sender_id: approval.Driver.Sender.id,
                message: notificationMessage,
                type: 'driver_approval',
                related_entity_id: driver_id,
                related_entity_type: 'DriverApproval' // Use a consistent type name
            }, transaction);
        }

        await transaction.commit();

        res.status(200).json({ message: `Driver status successfully updated to ${status}.` });

    } catch (err) {
        if (transaction) await transaction.rollback();
        return sendErrorResponse(res, 500, 'Failed to update driver approval status.', err);
    }
};


// =============================================
// Payment Handling
// =============================================

export const submitPaymentProof = async (req, res) => {
    const { delivery_id, payment_proof_url, receipt_link } = req.body;
    // --- Authorization ---
    // TODO: Get sender ID from authenticated user (using JWT)
    // const senderId = req.user.id; // Assuming JWT middleware adds user to req
    // if (!senderId || req.user.type !== 'sender') return sendErrorResponse(res, 403, 'Unauthorized: Sender access required.');

    // --- Validation ---
     if (!delivery_id) {
         return sendErrorResponse(res, 400, 'Delivery ID is required.');
     }
     if (!payment_proof_url && !receipt_link) {
       return sendErrorResponse(res, 400, 'Either a payment_proof_url (screenshot) or receipt_link is required.');
     }
     // TODO: Validate URL formats

     let transaction;
     try {
         transaction = await sequelize.transaction();

         const delivery = await DeliveryRequest.findByPk(delivery_id, {
              include: [Sender], // Include Sender for notification later if needed
              transaction // Lock row
         });

         if (!delivery) {
             await transaction.rollback();
             return sendErrorResponse(res, 404, `Delivery request with ID ${delivery_id} not found.`);
         }

         // --- Authorization Check ---
         // TODO: Uncomment and use actual sender ID from auth
         // if (delivery.sender_id !== senderId) {
         //     await transaction.rollback();
         //     return sendErrorResponse(res, 403, 'Unauthorized: You can only submit proof for your own delivery requests.');
         // }
         // --------------------------

         // Check if payment can be submitted based on status (e.g., only after delivered?)
         // if (!['delivered', 'pending_payment'].includes(delivery.status)) { // Example status check
         //     await transaction.rollback();
         //     return sendErrorResponse(res, 400, `Payment proof cannot be submitted when delivery status is ${delivery.status}.`);
         // }

         // Update delivery record
         delivery.payment_method = payment_proof_url ? 'screenshot' : 'cash'; // Assume screenshot if URL provided
         delivery.payment_proof_url = payment_proof_url || null;
         delivery.receipt_link = receipt_link || null;
         delivery.is_payment_approved = false; // Reset approval status
         delivery.approved_by = null;

         await delivery.save({ transaction });

         // Notify Sender of submission success
         await createNotification({
             sender_id: delivery.sender_id, // Use sender_id from the delivery record
             message: `Payment proof for delivery #${delivery.id} submitted successfully. It is now pending review.`,
             type: 'payment_proof_submitted',
             related_entity_id: delivery.id,
             related_entity_type: 'DeliveryRequestPayment'
         }, transaction);

         // Optionally notify Admin pool here

         await transaction.commit();

         res.status(200).json({ message: 'Payment information submitted successfully. Waiting for approval.' });

     } catch (err) {
         if (transaction) await transaction.rollback();
         return sendErrorResponse(res, 500, 'Failed to submit payment information.', err);
     }
};

export const adminApprovePayment = async (req, res) => {
      // --- Authorization ---
     // TODO: Implement middleware to check if req.user is an admin
     // if (req.user.role !== 'admin') return sendErrorResponse(res, 403, 'Unauthorized: Admin access required.');

     const { delivery_id } = req.body;
     // --- Validation ---
     if (!delivery_id) {
         return sendErrorResponse(res, 400, 'Delivery ID is required.');
     }

     let transaction;
     try {
          transaction = await sequelize.transaction();

          const delivery = await DeliveryRequest.findByPk(delivery_id, {
               include: [Sender], // Include Sender for notification
               transaction
          });

          if (!delivery) {
              await transaction.rollback();
              return sendErrorResponse(res, 404, `Delivery request with ID ${delivery_id} not found.`);
          }

          // --- Business Logic Checks ---
          if (delivery.payment_method !== 'screenshot') {
              await transaction.rollback();
              return sendErrorResponse(res, 400, 'Payment method is not "screenshot". Admin cannot approve this type.');
          }
           if (!delivery.payment_proof_url && !delivery.receipt_link) {
               await transaction.rollback();
               return sendErrorResponse(res, 400, 'No payment proof (screenshot URL or receipt link) found for this delivery.');
           }
          if (delivery.is_payment_approved) {
               await transaction.rollback();
               // Check who approved it to give a more specific message
               const approver = delivery.approved_by || 'unknown';
               return sendErrorResponse(res, 409, `Payment for delivery #${delivery.id} has already been approved by ${approver}.`);
          }
          // --------------------------

          delivery.is_payment_approved = true;
          delivery.approved_by = 'admin'; // Mark as approved by admin
          await delivery.save({ transaction });

          // Notify Sender
          await createNotification({
              sender_id: delivery.sender_id,
              message: `Admin has approved the payment for your delivery #${delivery.id}.`,
              type: 'payment_approved_admin',
              related_entity_id: delivery.id,
              related_entity_type: 'DeliveryRequestPayment'
          }, transaction);

          await transaction.commit();

          res.status(200).json({ message: `Payment for delivery #${delivery.id} approved by admin.` });

     } catch (err) {
         if (transaction) await transaction.rollback();
         return sendErrorResponse(res, 500, 'Failed to approve payment by admin.', err);
     }
};

export const driverApproveCash = async (req, res) => {
    // --- Authorization ---
    // TODO: Get driver ID from authenticated user (using JWT)
    // const driverId = req.user.id; // Assuming JWT middleware adds user to req
    // if (!driverId || req.user.type !== 'driver') return sendErrorResponse(res, 403, 'Unauthorized: Driver access required.');
    const { delivery_id, driverId } = req.body; // REMOVE driverId from body once JWT is implemented

    // --- Validation ---
     if (!delivery_id) {
         return sendErrorResponse(res, 400, 'Delivery ID is required.');
     }
     // TODO: Remove driverId validation once using JWT
     if (!driverId) {
         return sendErrorResponse(res, 400, 'Driver ID is required (should come from authentication).');
     }

     let transaction;
     try {
         transaction = await sequelize.transaction();

         const delivery = await DeliveryRequest.findByPk(delivery_id, {
             include: [Sender], // Include Sender for notification
             transaction
         });

         if (!delivery) {
             await transaction.rollback();
             return sendErrorResponse(res, 404, `Delivery request with ID ${delivery_id} not found.`);
         }

         // --- Authorization & Business Logic Checks ---
         // TODO: Replace driverId body param with authenticated driverId from JWT (req.user.id)
         if (delivery.assigned_driver_id !== parseInt(driverId, 10)) { // Ensure type comparison if needed
             await transaction.rollback();
             return sendErrorResponse(res, 403, 'Unauthorized: You are not assigned to this delivery request.');
         }
         if (delivery.payment_method !== 'cash') {
             await transaction.rollback();
             return sendErrorResponse(res, 400, 'Payment method is not "cash". Driver cannot approve this type.');
         }
          // Allow approval only at specific stages, e.g., upon delivery
          if (!['at_dropoff', 'delivered'].includes(delivery.status)) {
               await transaction.rollback();
               return sendErrorResponse(res, 400, `Cash payment cannot be confirmed while delivery status is ${delivery.status}.`);
          }
         if (delivery.is_payment_approved) {
               await transaction.rollback();
               const approver = delivery.approved_by || 'unknown';
               return sendErrorResponse(res, 409, `Payment for delivery #${delivery.id} has already been approved by ${approver}.`);
          }
         // -------------------------------------------

         delivery.is_payment_approved = true;
         delivery.approved_by = 'driver'; // Mark as approved by driver
         await delivery.save({ transaction });

         // Notify Sender
         await createNotification({
             sender_id: delivery.sender_id,
             message: `The driver has confirmed receiving cash payment for your delivery #${delivery.id}.`,
             type: 'payment_approved_driver',
             related_entity_id: delivery.id,
             related_entity_type: 'DeliveryRequestPayment'
         }, transaction);

         await transaction.commit();

         res.status(200).json({ message: `Cash payment for delivery #${delivery.id} confirmed by driver.` });

     } catch (err) {
         if (transaction) await transaction.rollback();
         return sendErrorResponse(res, 500, 'Failed to confirm cash payment by driver.', err);
     }
};


// =============================================
// Delivery Request Management
// =============================================

export const createDelivery = async (req, res) => {
     // --- Authorization ---
     // TODO: Get sender ID from authenticated user (using JWT)
     // const senderId = req.user.id;
     // if (!senderId || req.user.type !== 'sender') return sendErrorResponse(res, 403, 'Unauthorized: Sender access required.');
     const { sender_id, ...deliveryData } = req.body; // Extract sender_id, keep rest in deliveryData

     // --- Validation ---
     // TODO: REMOVE sender_id from body and use authenticated senderId (req.user.id)
     if (!sender_id) {
         return sendErrorResponse(res, 400, 'sender_id is required (should come from authentication).');
     }
     // TODO: Uncomment and use actual sender ID from auth
     // if (parseInt(sender_id, 10) !== senderId) { // Ensure type comparison if needed
     //     return sendErrorResponse(res, 403, 'Unauthorized: You can only create deliveries for your own account.');
     // }
     if (!deliveryData.pickup_lat || !deliveryData.pickup_lng || !deliveryData.dropoff_lat || !deliveryData.dropoff_lng) {
         return sendErrorResponse(res, 400, 'Pickup and Dropoff coordinates (lat, lng) are required.');
     }
     // TODO: Add validation for coordinate ranges, weight/size formats etc.

     let transaction;
     try {
         transaction = await sequelize.transaction();

         // Optional: Verify sender exists (guaranteed by JWT auth middleware)
         // const senderExists = await Sender.findByPk(senderId, { transaction });
         // if (!senderExists) {
         //     await transaction.rollback();
         //     return sendErrorResponse(res, 404, `Sender not found.`); // Should not happen if JWT is valid
         // }

         // Create the delivery request using the authenticated senderId
         const newDelivery = await DeliveryRequest.create({
             sender_id: sender_id, // TODO: Replace with senderId from JWT (req.user.id)
             ...deliveryData,
             status: 'pending' // Ensure initial status is set correctly
         }, { transaction });

         // Notify Sender
         await createNotification({
             sender_id: newDelivery.sender_id,
             message: `Your delivery request #${newDelivery.id} from [Pickup Location Name] to [Dropoff Location Name] has been created successfully. We are finding a driver for you.`, // TODO: Get location names via reverse geocoding if possible
             type: 'delivery_created',
             related_entity_id: newDelivery.id,
             related_entity_type: 'DeliveryRequest'
         }, transaction);

         // --- Trigger Driver Matching Logic (Asynchronous) ---
         // This should ideally happen outside the controller response path
         // Example: dispatchJobToQueue('findDriverForDelivery', newDelivery.id);
         console.log(`Delivery #${newDelivery.id} created. TODO: Trigger driver matching.`);
         // --------------------------------------------------

         await transaction.commit();

         // Return the created object (or a cleaner DTO)
         res.status(201).json(newDelivery);

     } catch (err) {
         if (transaction) await transaction.rollback();
          if (err.name === 'SequelizeValidationError') {
               return sendErrorResponse(res, 400, 'Delivery creation failed due to validation errors.', err.errors);
         }
         return sendErrorResponse(res, 500, 'Failed to create delivery request.', err);
     }
};

// TODO: Add controllers for:
// - Assigning a driver to a delivery (Admin/System action) -> updateDeliveryStatus, assignDriver
// - Updating delivery status (Driver action) -> updateDeliveryStatus
// - Updating driver location (Driver action) -> updateDriverLocation
// - Fetching deliveries (for Sender, Driver, Admin with filtering/pagination) -> getDeliveries
// - Fetching notifications (for Sender, Driver) -> getNotifications
// - Matching new requests to 'on the way' drivers (System action)
// - Add Driver Login (similar to Sender Login, but using driver phone/6-digit PIN)


// =============================================
// Pricing Management
// =============================================

export const updatePricing = async (req, res) => {
     // --- Authorization ---
     // TODO: Implement middleware to check if req.user is an admin
     // if (req.user.role !== 'admin') return sendErrorResponse(res, 403, 'Unauthorized: Admin access required.');

     const { price_per_km, price_per_kg, price_per_size_unit, price_per_quantity } = req.body;

     // --- Validation ---
     // Basic check if any data is provided
     if (price_per_km === undefined && price_per_kg === undefined && price_per_size_unit === undefined && price_per_quantity === undefined) {
          return sendErrorResponse(res, 400, 'At least one pricing parameter must be provided.');
     }
     // TODO: Add validation to ensure provided values are numbers >= 0

     try {
         // Assuming a single, global pricing config stored with ID 1
         // Upsert ensures it's created if it doesn't exist, or updated if it does.
         const [pricing, created] = await DynamicPricing.upsert(
             {
                 id: 1, // Target the specific row
                 price_per_km: price_per_km,
                 price_per_kg: price_per_kg,
                 price_per_size_unit: price_per_size_unit,
                 price_per_quantity: price_per_quantity
             },
             { returning: true } // Return the created/updated record
         );

         res.status(200).json({
             message: `Dynamic pricing configuration ${created ? 'created' : 'updated'}.`,
             pricing: pricing // Send back the updated pricing object
         });

     } catch (err) {
          if (err.name === 'SequelizeValidationError') {
               return sendErrorResponse(res, 400, 'Pricing update failed due to validation errors.', err.errors);
         }
         return sendErrorResponse(res, 500, 'Failed to update dynamic pricing.', err);
     }
};
