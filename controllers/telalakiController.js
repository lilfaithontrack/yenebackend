// controllers/yourControllerName.js (or wherever this code resides)

// Import Models and Sequelize instance from Telalaki.js
import {
    Sender,
    Vehicle,
    Driver,
    AdminApproval, // Added import
    DeliveryRequest,
    DynamicPricing,
    Notification,
    sequelize // Import the instance for transactions
} from '../models/Telalaki.js'; // Adjust path as needed

// Import Sequelize library directly for Op etc.
import { Sequelize } from 'sequelize';
import bcrypt from 'bcrypt'; // For hashing PINs
import jwt from 'jsonwebtoken'; // For generating login tokens

const Op = Sequelize.Op; // Useful for complex queries

const JWT_SECRET = process.env.JWT_SECRET; // Load secret from environment variables
const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

// --- Helper Function for Notifications (No changes needed) ---
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

// --- Helper for Error Responses (No changes needed) ---
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
    // Use 'full_name' and 'phone' consistent with Sender model
    const { full_name, phone, pin } = req.body; // Added pin for direct registration if desired

    // Basic input validation
    if (!full_name || !phone || !pin) {
        return sendErrorResponse(res, 400, 'Full name, phone number, and PIN are required.');
    }
    if (!/^09\d{8}$/.test(phone)) {
        return sendErrorResponse(res, 400, 'Invalid phone number format. Use 09xxxxxxxx format.');
    }
    if (!/^\d{4}$/.test(pin)) {
         return sendErrorResponse(res, 400, 'Sender PIN must be exactly 4 digits.');
    }

    const existingSender = await Sender.findOne({ where: { phone } }); // Use 'phone' from model
    if (existingSender) {
      // Use 409 Conflict status code
      return sendErrorResponse(res, 409, 'Phone number is already registered.');
    }

    // Hash the PIN before saving
    const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);

    // Use field names from Sender model ('full_name', 'phone', 'pin')
    const sender = await Sender.create({ full_name, phone, pin: hashedPin });

    // Exclude PIN from the response
    const senderData = { ...sender.toJSON() };
    delete senderData.pin;

    res.status(201).json({ message: 'Sender registered successfully.', sender: senderData });

  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
         return sendErrorResponse(res, 400, 'Registration failed due to validation errors.', error.errors);
    }
    // Log the detailed error server-side
    console.error('Sender Registration Error:', error);
    // Send generic error response
    sendErrorResponse(res, 500, 'Sender registration failed due to an internal error.');
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
     // Pin format check
     if (!/^\d{4}$/.test(pin)) {
        return sendErrorResponse(res, 400, 'Invalid PIN format. Must be 4 digits.');
    }


    try {
        // Find the sender by phone number
        // Ensure 'pin' attribute is selected (it should be by default unless excluded by scope)
        const sender = await Sender.findOne({
             where: { phone },
             // attributes: ['id', 'full_name', 'phone', 'pin', 'createdAt', 'updatedAt'] // Explicitly list if needed
        });

        if (!sender) {
            // Use a generic message to avoid revealing if the phone number exists or not
            return sendErrorResponse(res, 401, 'Login failed: Invalid phone number or PIN.');
        }

        // Compare the provided PIN with the stored hash
        // Ensure sender.pin is not null/undefined before comparing
        if (!sender.pin) {
             console.error(`Login Error: Sender ${sender.id} has no PIN hash stored.`);
             return sendErrorResponse(res, 500, 'Login failed due to a server configuration issue.');
        }
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
            type: 'sender' // Add a type to distinguish tokens
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
    // Expecting nested structure or flattened - clarify based on frontend
    // Assuming flattened for now: sender_full_name, sender_phone, sender_pin, driver_full_name, driver_pin, driver_is_owner, vehicle_...
    const {
        sender_full_name, sender_phone, sender_pin, // Sender details
        driver_full_name, driver_pin, driver_phone, driver_email, driver_region, driver_zone, driver_district, driver_house_number, driver_license_photo, identification_photo, is_owner, // Driver details
        // Vehicle details (only required if is_owner is false)
        owner_full_name, region: vehicle_region, zone: vehicle_zone, district: vehicle_district, house_number: vehicle_house_number, phone: vehicle_phone, email: vehicle_email, car_type, car_name, manufacture_year, cargo_capacity, license_plate, commercial_license, tin_number, car_license_photo, owner_id_photo, car_photo, owner_photo
     } = req.body;

    let transaction;

    // --- Basic Input Validation ---
    if (!sender_full_name || !sender_phone || !sender_pin || !driver_full_name || !driver_pin) {
        return sendErrorResponse(res, 400, 'Sender (name, phone, 4-digit PIN) and Driver (name, 6-digit PIN) information are required.');
    }
    // Sender PIN validation
     if (!/^\d{4}$/.test(sender_pin)) {
         return sendErrorResponse(res, 400, 'Sender PIN must be exactly 4 digits.');
     }
    // Driver PIN validation
    if (!/^\d{6}$/.test(driver_pin)) {
         return sendErrorResponse(res, 400, 'Driver PIN must be exactly 6 digits.');
     }
    // Phone validation
    if (!/^09\d{8}$/.test(sender_phone)) {
         return sendErrorResponse(res, 400, 'Invalid Sender phone number format. Use 09xxxxxxxx format.');
    }
    // Add driver phone format validation if required and unique
    // if (driver_phone && !/^09\d{8}$/.test(driver_phone)) {
    //     return sendErrorResponse(res, 400, 'Invalid Driver phone number format.');
    // }

    // Vehicle required check
    const driverIsOwner = is_owner === true || is_owner === 'true'; // Handle boolean or string 'true'
    if (!driverIsOwner && (!car_type || !license_plate /* Add other required vehicle fields */)) {
         return sendErrorResponse(res, 400, 'Complete vehicle information (type, license plate, etc.) is required if the driver is not the owner.');
    }
    // TODO: Add more specific validation (e.g., email format, photo URLs) using a library like Joi

    try {
        // Use the imported sequelize instance for transaction
        transaction = await sequelize.transaction();

        // Check if sender phone already exists
        const existingSender = await Sender.findOne({ where: { phone: sender_phone }, transaction });
        if (existingSender) {
             await transaction.rollback();
             return sendErrorResponse(res, 409, 'Sender phone number is already registered.');
        }
        // Check if driver phone already exists (if driver phone is unique in your model)
        // const existingDriverPhone = await Driver.findOne({ where: { phone: driver_phone }, transaction });
        // if (driver_phone && existingDriverPhone) {
        //      await transaction.rollback();
        //      return sendErrorResponse(res, 409, 'Driver phone number is already registered.');
        // }

        // 1. Hash PINs and Create Sender
        const hashedSenderPin = await bcrypt.hash(sender_pin, SALT_ROUNDS);
        const newSender = await Sender.create({
             full_name: sender_full_name,
             phone: sender_phone,
             pin: hashedSenderPin
        }, { transaction });

        // 2. Hash Driver PIN and Create Driver, linking to Sender
        const hashedDriverPin = await bcrypt.hash(driver_pin, SALT_ROUNDS);
        const newDriver = await Driver.create({
             // Map fields from request body to Driver model
             full_name: driver_full_name,
             phone: driver_phone, // Make sure this is collected if needed
             email: driver_email,
             region: driver_region,
             zone: driver_zone,
             district: driver_district,
             house_number: driver_house_number,
             driver_license_photo: driver_license_photo,
             identification_photo: identification_photo,
             is_owner: driverIsOwner,
             pin: hashedDriverPin, // Store hashed driver pin
             sender_id: newSender.id,
             // Set initial status? Defaults are handled by model definition
             // current_status: 'offline',
             // is_available_for_new: false, // Driver is not available until approved
        }, { transaction });

        // 3. Create Vehicle (if applicable)
        let newVehicle = null;
        if (!driverIsOwner) {
             newVehicle = await Vehicle.create({
                 // Map fields from request body to Vehicle model
                 owner_full_name: owner_full_name,
                 region: vehicle_region,
                 zone: vehicle_zone,
                 district: vehicle_district,
                 house_number: vehicle_house_number,
                 phone: vehicle_phone,
                 email: vehicle_email,
                 car_type: car_type,
                 car_name: car_name,
                 manufacture_year: manufacture_year,
                 cargo_capacity: cargo_capacity,
                 license_plate: license_plate,
                 commercial_license: commercial_license,
                 tin_number: tin_number,
                 car_license_photo: car_license_photo,
                 owner_id_photo: owner_id_photo,
                 car_photo: car_photo,
                 owner_photo: owner_photo
                 // TODO: Consider adding driver_id or sender_id FK to Vehicle model for better association
                 // driver_id: newDriver.id, // Example if FK is added
             }, { transaction });
        }

        // 4. Create initial AdminApproval record (using imported AdminApproval model)
        await AdminApproval.create({ driver_id: newDriver.id, status: 'pending' }, { transaction });

        // 5. Create Notification for Sender (using helper)
        await createNotification({
            sender_id: newSender.id,
            message: `Your driver registration for ${driver_full_name} is submitted and pending approval.`,
            type: 'driver_registration',
            related_entity_id: newDriver.id,
            related_entity_type: 'Driver'
        }, transaction); // Pass transaction

        // If all successful, commit the transaction
        await transaction.commit();

        return res.status(201).json({
            message: 'Driver registered successfully and pending approval.',
            driverId: newDriver.id,
            senderId: newSender.id,
            vehicleId: newVehicle ? newVehicle.id : null
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

// =============================================
// Driver Approval Management
// =============================================
export const updateApproval = async (req, res) => {
    // --- Authorization ---
    // TODO: Implement middleware to check if req.user is an admin
    // const adminId = req.user.id;
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
        // Use imported sequelize instance
        transaction = await sequelize.transaction();

        // Find approval record, including associated Driver and Sender for notification
        // Uses imported AdminApproval, Driver, Sender models
        const approval = await AdminApproval.findOne({
            where: { driver_id },
            include: [{
                model: Driver,
                as: 'driver', // Use alias if defined in telalaki.js associations
                required: true, // Ensure driver exists
                include: [{
                    model: Sender,
                    as: 'senderAccount', // Use alias if defined
                    required: true // Ensure sender exists (based on current structure)
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
        const driver = approval.driver; // Access related driver using alias or default name
        const sender = driver.senderAccount; // Access related sender using alias or default name

        // Update approval record
        approval.status = status;
        approval.approved_at = status === 'approved' ? new Date() : null;
        approval.rejected_reason = status === 'rejected' ? reason : null;
        await approval.save({ transaction });

        // --- Optional: Update Driver's status upon approval ---
        if (status === 'approved' && driver) {
             driver.current_status = 'idle'; // Set initial status
             driver.is_available_for_new = true;
             await driver.save({ transaction });
        } else if (status === 'rejected' && driver) {
             // Optionally set driver status if rejected (e.g., back to offline or a specific 'rejected' status)
             driver.current_status = 'offline';
             driver.is_available_for_new = false;
             await driver.save({ transaction });
        }
        // ----------------------------------------------------

        // Notify the Sender
        let notificationMessage = '';
        if (status === 'approved' && originalStatus !== 'approved') {
            notificationMessage = `Congratulations! Your driver profile for ${driver.full_name} (ID: ${driver_id}) has been approved. They can now receive delivery requests.`;
        } else if (status === 'rejected' && originalStatus !== 'rejected') {
            notificationMessage = `Your driver profile for ${driver.full_name} (ID: ${driver_id}) registration was rejected. Reason: ${reason}`;
        }

        if (notificationMessage && sender) {
            await createNotification({
                sender_id: sender.id,
                message: notificationMessage,
                type: 'driver_approval_update', // More specific type
                related_entity_id: driver_id,
                related_entity_type: 'DriverApproval' // Use a consistent type name
            }, transaction);
        } else if (!sender) {
             console.warn(`Could not send approval notification: Sender not found for Driver ID ${driver_id}`);
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
    // TODO: Get sender ID from authenticated user (req.user.id)
    const senderId = req.user?.id; // Example: Use optional chaining from auth middleware
    // if (!senderId || req.user.type !== 'sender') return sendErrorResponse(res, 403, 'Unauthorized: Sender access required.');

    // --- Validation ---
     if (!delivery_id) {
         return sendErrorResponse(res, 400, 'Delivery ID is required.');
     }
     if (!payment_proof_url && !receipt_link) {
        return sendErrorResponse(res, 400, 'Either a payment_proof_url (screenshot) or receipt_link is required.');
     }
     // TODO: Validate URL formats if needed

     let transaction;
     try {
         // Use imported sequelize instance
         transaction = await sequelize.transaction();

         // Use imported DeliveryRequest and Sender models
         const delivery = await DeliveryRequest.findByPk(delivery_id, {
              include: [{ model: Sender, as: 'sender' }], // Use alias if defined
              transaction // Lock row
         });

         if (!delivery) {
              await transaction.rollback();
              return sendErrorResponse(res, 404, `Delivery request with ID ${delivery_id} not found.`);
         }

         // --- Authorization Check ---
         // TODO: Uncomment and use actual sender ID from auth
         // if (delivery.sender_id !== senderId) {
         //      await transaction.rollback();
         //      return sendErrorResponse(res, 403, 'Unauthorized: You can only submit proof for your own delivery requests.');
         // }
         // --------------------------

         // Check if payment can be submitted based on status (e.g., only after delivered?)
         // Example: Allow submission anytime after creation until approved.
         if (delivery.is_payment_approved) {
              await transaction.rollback();
              return sendErrorResponse(res, 400, `Payment for delivery #${delivery.id} has already been approved.`);
         }


         // Update delivery record
         delivery.payment_method = payment_proof_url ? 'screenshot' : 'cash'; // Re-evaluate if receipt_link implies a different method
         delivery.payment_proof_url = payment_proof_url || null;
         delivery.receipt_link = receipt_link || null;
         delivery.is_payment_approved = false; // Ensure it's pending approval
         delivery.approved_by = null; // Clear previous approver if re-submitting

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
     // const adminId = req.user.id;
     // if (req.user.role !== 'admin') return sendErrorResponse(res, 403, 'Unauthorized: Admin access required.');

     const { delivery_id } = req.body;
     // --- Validation ---
     if (!delivery_id) {
         return sendErrorResponse(res, 400, 'Delivery ID is required.');
     }

     let transaction;
     try {
         // Use imported sequelize instance
          transaction = await sequelize.transaction();

          // Use imported DeliveryRequest and Sender models
          const delivery = await DeliveryRequest.findByPk(delivery_id, {
               include: [{ model: Sender, as: 'sender' }], // Use alias if defined
               transaction
          });

          if (!delivery) {
               await transaction.rollback();
               return sendErrorResponse(res, 404, `Delivery request with ID ${delivery_id} not found.`);
          }

          // --- Business Logic Checks ---
          if (delivery.payment_method !== 'screenshot') { // Assuming admin only approves screenshots
               await transaction.rollback();
               return sendErrorResponse(res, 400, 'Payment method is not "screenshot". Admin approval is typically for screenshot proofs.');
          }
           if (!delivery.payment_proof_url && !delivery.receipt_link) { // Check if there's proof to review
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

          // Notify Sender (using helper)
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
    // TODO: Get driver ID from authenticated user (req.user.id)
    const driverId = req.user?.id; // Example from auth middleware
    const { delivery_id } = req.body; // Only need delivery_id from body
    // if (!driverId || req.user.type !== 'driver') return sendErrorResponse(res, 403, 'Unauthorized: Driver access required.');

    // --- Validation ---
     if (!delivery_id) {
         return sendErrorResponse(res, 400, 'Delivery ID is required.');
     }
     // Remove driverId validation once using JWT
     // if (!driverId) {
     //     return sendErrorResponse(res, 400, 'Driver ID missing from authentication.');
     // }

     let transaction;
     try {
         // Use imported sequelize instance
         transaction = await sequelize.transaction();

         // Use imported DeliveryRequest and Sender models
         const delivery = await DeliveryRequest.findByPk(delivery_id, {
              include: [{ model: Sender, as: 'sender' }], // Use alias if defined
              transaction
         });

         if (!delivery) {
              await transaction.rollback();
              return sendErrorResponse(res, 404, `Delivery request with ID ${delivery_id} not found.`);
         }

         // --- Authorization & Business Logic Checks ---
         // Use authenticated driverId from JWT (req.user.id)
         if (delivery.assigned_driver_id !== driverId) {
              await transaction.rollback();
              return sendErrorResponse(res, 403, 'Unauthorized: You are not the assigned driver for this delivery request.');
         }
         if (delivery.payment_method !== 'cash') {
              await transaction.rollback();
              return sendErrorResponse(res, 400, 'Payment method is not "cash". Driver can only confirm cash payments.');
         }
          // Allow approval only at specific stages, e.g., upon delivery
          if (!['at_dropoff', 'delivered'].includes(delivery.status)) {
               await transaction.rollback();
               return sendErrorResponse(res, 400, `Cash payment cannot be confirmed while delivery status is ${delivery.status}. Usually confirmed at dropoff or after delivery.`);
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

         // Notify Sender (using helper)
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
      // TODO: Get sender ID from authenticated user (req.user.id)
      const senderId = req.user?.id; // Example from auth middleware
      // if (!senderId || req.user.type !== 'sender') return sendErrorResponse(res, 403, 'Unauthorized: Sender access required.');

      // Use authenticated senderId, remove sender_id from body
      const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, ...deliveryData } = req.body;

      // --- Validation ---
      // Remove sender_id validation once using JWT
      // if (!senderId) {
      //     return sendErrorResponse(res, 400, 'Sender ID missing from authentication.');
      // }
      if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) {
          return sendErrorResponse(res, 400, 'Pickup and Dropoff coordinates (lat, lng) are required.');
      }
      // TODO: Add validation for coordinate ranges, weight/size formats etc.

      let transaction;
      try {
          // Use imported sequelize instance
          transaction = await sequelize.transaction();

          // Optional: Verify sender exists (should be guaranteed by JWT auth middleware)
          // const senderExists = await Sender.findByPk(senderId, { transaction });
          // if (!senderExists) { ... } // Should not happen if JWT is valid

          // Create the delivery request using the authenticated senderId
          // Uses imported DeliveryRequest model
          const newDelivery = await DeliveryRequest.create({
              sender_id: senderId, // Use ID from authenticated user
              pickup_lat,
              pickup_lng,
              dropoff_lat,
              dropoff_lng,
              ...deliveryData, // Spread remaining optional fields (weight, size, quantity, price etc.)
              status: 'pending', // Ensure initial status is set correctly
              payment_method: deliveryData.payment_method || 'cash' // Set default payment method if not provided
          }, { transaction });

          // Notify Sender (using helper)
          await createNotification({
              sender_id: newDelivery.sender_id,
              message: `Your delivery request #${newDelivery.id} has been created. We are finding a driver.`, // Simplified message
              type: 'delivery_created',
              related_entity_id: newDelivery.id,
              related_entity_type: 'DeliveryRequest'
          }, transaction);

          // --- Trigger Driver Matching Logic (Asynchronous) ---
          // This should ideally happen outside the controller response path
          console.log(`Delivery #${newDelivery.id} created. TODO: Trigger driver matching.`);
          // Example: queueService.add('findDriver', { deliveryId: newDelivery.id });
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

// =============================================
// Pricing Management
// =============================================

export const updatePricing = async (req, res) => {
      // --- Authorization ---
      // TODO: Implement middleware to check if req.user is an admin
      // const adminId = req.user.id;
      // if (req.user.role !== 'admin') return sendErrorResponse(res, 403, 'Unauthorized: Admin access required.');

      // Only include fields defined in the DynamicPricing model
      const { price_per_km, price_per_kg, price_per_size_unit, price_per_quantity } = req.body;

      // --- Validation ---
      // Basic check if any valid data is provided
      const updateData = {};
      if (price_per_km !== undefined && !isNaN(parseFloat(price_per_km))) updateData.price_per_km = parseFloat(price_per_km);
      if (price_per_kg !== undefined && !isNaN(parseFloat(price_per_kg))) updateData.price_per_kg = parseFloat(price_per_kg);
      if (price_per_size_unit !== undefined && !isNaN(parseFloat(price_per_size_unit))) updateData.price_per_size_unit = parseFloat(price_per_size_unit);
      if (price_per_quantity !== undefined && !isNaN(parseFloat(price_per_quantity))) updateData.price_per_quantity = parseFloat(price_per_quantity);

      if (Object.keys(updateData).length === 0) {
           return sendErrorResponse(res, 400, 'At least one valid pricing parameter (numeric) must be provided.');
      }

      try {
          // Assuming a single, global pricing config stored with ID 1
          // Upsert ensures it's created if it doesn't exist, or updated if it does.
          // Use imported DynamicPricing model
          const [pricing, created] = await DynamicPricing.upsert(
               {
                    id: 1, // Target the specific row (ensure your DB has this row or handle creation)
                    ...updateData // Only include validated fields
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

// --- TODO: Add Driver Login Controller ---
/*
export const loginDriver = async (req, res) => {
    const { phone, pin } = req.body; // Driver phone and 6-digit PIN

    // 1. Validate input (phone format, 6-digit PIN)
    if (!phone || !pin || !/^\d{6}$/.test(pin) // Add phone format check) {
       return sendErrorResponse(res, 400, 'Driver phone and 6-digit PIN are required.');
    }

    try {
        // 2. Find Driver by phone (make sure phone is unique or handle multiple)
        const driver = await Driver.findOne({ where: { phone } }); // Ensure 'pin' is selected

        if (!driver) {
            return sendErrorResponse(res, 401, 'Login failed: Invalid driver phone or PIN.');
        }

         // Check if driver is approved
         const approval = await AdminApproval.findOne({ where: { driver_id: driver.id } });
         if (!approval || approval.status !== 'approved') {
             return sendErrorResponse(res, 403, `Login failed: Driver account is ${approval ? approval.status : 'not processed'}.`);
         }


        // 3. Compare hashed PIN
        if (!driver.pin) { ... handle missing pin hash ... }
        const isPinValid = await bcrypt.compare(pin, driver.pin);

        if (!isPinValid) {
            return sendErrorResponse(res, 401, 'Login failed: Invalid driver phone or PIN.');
        }

        // 4. Generate JWT
        if (!JWT_SECRET) { ... handle missing secret ... }
        const payload = { id: driver.id, phone: driver.phone, type: 'driver' };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        // 5. Return success response (excluding PIN)
        const driverData = { ...driver.toJSON() };
        delete driverData.pin;

        res.status(200).json({ message: 'Driver login successful.', accessToken, driver: driverData });

    } catch (err) {
        sendErrorResponse(res, 500, 'Driver login failed.', err);
    }
};
*/

// TODO: Add other controllers as previously mentioned (getDeliveries, updateDeliveryStatus, updateDriverLocation, getNotifications etc.)
