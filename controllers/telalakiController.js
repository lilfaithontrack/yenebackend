import db from '../models/Telalaki.js';
// --- Update imports: Rename User to Sender, add Notification ---
const { Sender, Vehicle, Driver, AdminApproval, DeliveryRequest, DynamicPricing, Notification } = db;
// ------------------------------------------------------------

// Register driver (with or without vehicle) - linked to a Sender account
export const registerDriver = async (req, res) => {
  try {
    // --- Expect 'sender' object instead of 'user' in the request body ---
    const { sender, driver, vehicle } = req.body;
    // --------------------------------------------------------------

    if (!sender || !driver) {
        return res.status(400).json({ message: 'Sender and Driver information are required.' });
    }

    // --- Create Sender first ---
    const newSender = await Sender.create(sender);
    // -------------------------

    // --- Create Driver, linking to the new Sender's ID ---
    const newDriver = await Driver.create({
      ...driver,
      sender_id: newSender.id, // Use sender_id and the newSender's ID
    });
    // ---------------------------------------------------

    // Create vehicle if driver is not the owner and vehicle info is provided
    if (driver.is_owner === false && vehicle) { // Explicitly check for false if is_owner might be omitted
      // --- Consider linking vehicle to driver_id or sender_id for better tracking ---
      await Vehicle.create({
        ...vehicle,
        // Example: driver_id: newDriver.id // Uncomment and adjust if you add this FK to Vehicle model
      });
      // ------------------------------------------------------------------------------
    }

    // Create the initial pending approval record
    await AdminApproval.create({ driver_id: newDriver.id });

    // --- Optional: Notify Sender about pending registration ---
    try {
        await Notification.create({
            sender_id: newSender.id,
            message: `Your driver registration is submitted and pending approval.`,
            type: 'driver_registration',
            related_entity_id: newDriver.id,
            related_entity_type: 'Driver'
        });
    } catch (notificationError) {
        console.error("Failed to create notification for driver registration:", notificationError);
        // Decide if registration should fail if notification fails, usually not.
    }
    // -------------------------------------------------------

    res.status(201).json({ message: 'Driver registered and pending approval.', driverId: newDriver.id, senderId: newSender.id });
  } catch (err) {
     // Handle potential Sequelize validation errors (e.g., unique phone constraint)
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Registration failed. Phone number might already be in use.', error: err.message });
    }
    console.error("Driver Registration Error:", err); // Log the full error
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// Admin approves/rejects driver
export const updateApproval = async (req, res) => {
  try {
    const { driver_id, status, reason } = req.body;

    if (!driver_id || !status || (status === 'rejected' && !reason)) {
        return res.status(400).json({ message: 'Missing required fields (driver_id, status, reason if rejected).' });
    }

    // --- Find approval and include associated Driver and Sender ---
    const approval = await AdminApproval.findOne({
        where: { driver_id },
        include: [{
            model: Driver,
            include: [Sender] // Include Sender associated with the Driver
        }]
    });
    // ---------------------------------------------------------

    if (!approval) return res.status(404).json({ message: 'Approval record not found for this driver' });
    if (!approval.Driver) return res.status(404).json({ message: 'Driver not found for this approval record' });
    if (!approval.Driver.Sender) return res.status(404).json({ message: 'Sender not found for this driver' });


    const originalStatus = approval.status;
    approval.status = status;
    approval.approved_at = status === 'approved' ? new Date() : null;
    approval.rejected_reason = status === 'rejected' ? reason : null;

    await approval.save();

    // --- Notify the Sender associated with the Driver ---
    const senderId = approval.Driver.Sender.id;
    let notificationMessage = '';
    if (status === 'approved' && originalStatus !== 'approved') {
        notificationMessage = `Congratulations! Your driver profile has been approved.`;
    } else if (status === 'rejected' && originalStatus !== 'rejected') {
        notificationMessage = `Your driver profile registration was rejected. Reason: ${reason}`;
    }

    if (notificationMessage) {
        try {
            await Notification.create({
                sender_id: senderId,
                message: notificationMessage,
                type: 'driver_approval',
                related_entity_id: driver_id,
                related_entity_type: 'DriverApproval'
            });
        } catch (notificationError) {
            console.error("Failed to create notification for driver approval update:", notificationError);
            // Continue even if notification fails
        }
    }
    // ------------------------------------------------

    res.status(200).json({ message: `Driver status updated to ${status}.` });
  } catch (err) {
    console.error("Approval Update Error:", err);
    res.status(500).json({ message: 'Approval update failed', error: err.message });
  }
};

// Submit payment proof (either screenshot or receipt link)
export const submitPaymentProof = async (req, res) => {
  try {
    const { delivery_id, payment_proof_url, receipt_link } = req.body;

    if (!delivery_id) {
        return res.status(400).json({ message: 'Delivery ID is required.' });
    }
    if (!payment_proof_url && !receipt_link) {
      return res.status(400).json({ message: 'Either a screenshot URL or receipt link is required.' });
    }

    // --- Find delivery and include Sender ---
    const delivery = await DeliveryRequest.findByPk(delivery_id, {
        include: [Sender]
    });
    // --------------------------------------
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    if (!delivery.Sender) return res.status(404).json({ message: 'Sender not found for this delivery' });


    // Assuming proof submission implies screenshot method unless specified otherwise
    delivery.payment_method = 'screenshot';
    delivery.payment_proof_url = payment_proof_url || null;
    delivery.receipt_link = receipt_link || null;
    delivery.is_payment_approved = false; // Reset approval status on new proof submission
    delivery.approved_by = null;

    await delivery.save();

    // --- Notify Sender about submission ---
    try {
        await Notification.create({
            sender_id: delivery.Sender.id,
            message: `Payment proof for delivery #${delivery.id} submitted successfully. It's pending review.`,
            type: 'payment_proof_submitted',
            related_entity_id: delivery.id,
            related_entity_type: 'DeliveryRequestPayment'
        });
        // Optionally: Notify Admin (requires Admin model/logic)
    } catch (notificationError) {
        console.error("Failed to create notification for payment proof submission:", notificationError);
    }
    // -----------------------------------

    res.status(200).json({ message: 'Payment info submitted. Waiting for admin approval.' });
  } catch (err) {
    console.error("Submit Payment Proof Error:", err);
    res.status(500).json({ message: 'Failed to submit payment info', error: err.message });
  }
};

// Admin approves screenshot payment
export const adminApprovePayment = async (req, res) => {
  try {
    const { delivery_id } = req.body;
    if (!delivery_id) {
        return res.status(400).json({ message: 'Delivery ID is required.' });
    }

    // --- Find delivery and include Sender ---
    const delivery = await DeliveryRequest.findByPk(delivery_id, {
        include: [Sender]
    });
    // --------------------------------------

    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    if (delivery.payment_method !== 'screenshot') {
      return res.status(400).json({ message: 'Payment method is not screenshot, cannot be approved by admin this way.' });
    }
     if (delivery.is_payment_approved && delivery.approved_by === 'admin') {
      return res.status(400).json({ message: 'Payment already approved by admin.' });
    }
    if (!delivery.Sender) return res.status(404).json({ message: 'Sender not found for this delivery' });


    delivery.is_payment_approved = true;
    delivery.approved_by = 'admin';
    await delivery.save();

    // --- Notify Sender about admin approval ---
    try {
        await Notification.create({
            sender_id: delivery.Sender.id,
            message: `Payment for delivery #${delivery.id} has been approved by admin.`,
            type: 'payment_approved_admin',
            related_entity_id: delivery.id,
            related_entity_type: 'DeliveryRequestPayment'
        });
    } catch (notificationError) {
        console.error("Failed to create notification for admin payment approval:", notificationError);
    }
    // ---------------------------------------

    res.status(200).json({ message: 'Payment approved by admin' });
  } catch (err) {
    console.error("Admin Approve Payment Error:", err);
    res.status(500).json({ message: 'Admin approval failed', error: err.message });
  }
};

// Driver approves cash payment
export const driverApproveCash = async (req, res) => {
  try {
    // --- Assume driver's ID is available (e.g., from auth middleware) ---
    // const driverId = req.user.driverId; // Example: Get driver ID from authenticated user
    const { delivery_id /*, driverId */ } = req.body; // Get delivery_id from body
     if (!delivery_id) {
        return res.status(400).json({ message: 'Delivery ID is required.' });
    }
    // -------------------------------------------------------------------

    // --- Find delivery and include Sender ---
    const delivery = await DeliveryRequest.findByPk(delivery_id, {
        include: [Sender]
    });
    // --------------------------------------

    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

    // --- Add check: Ensure the requesting driver is assigned to this delivery (if applicable) ---
    // if (delivery.assigned_driver_id !== driverId) {
    //     return res.status(403).json({ message: 'Driver not assigned to this delivery.' });
    // }
    // ----------------------------------------------------------------------------------------

    if (delivery.payment_method !== 'cash') {
      return res.status(400).json({ message: 'Payment method is not cash.' });
    }
     if (delivery.is_payment_approved && delivery.approved_by === 'driver') {
      return res.status(400).json({ message: 'Cash payment already approved by driver.' });
    }
    if (!delivery.Sender) return res.status(404).json({ message: 'Sender not found for this delivery' });


    delivery.is_payment_approved = true;
    delivery.approved_by = 'driver';
    await delivery.save();

    // --- Notify Sender about driver cash confirmation ---
     try {
        await Notification.create({
            sender_id: delivery.Sender.id,
            message: `Cash payment for delivery #${delivery.id} has been confirmed by the driver.`,
            type: 'payment_approved_driver',
            related_entity_id: delivery.id,
            related_entity_type: 'DeliveryRequestPayment'
        });
    } catch (notificationError) {
        console.error("Failed to create notification for driver cash approval:", notificationError);
    }
    // -----------------------------------------------

    res.status(200).json({ message: 'Cash payment approved by driver' });
  } catch (err) {
     console.error("Driver Approve Cash Error:", err);
    res.status(500).json({ message: 'Driver approval failed', error: err.message });
  }
};

// Create delivery request
export const createDelivery = async (req, res) => {
  try {
    // --- Ensure sender_id is provided in req.body ---
    const { sender_id, ...deliveryData } = req.body;
    if (!sender_id) {
        return res.status(400).json({ message: 'sender_id is required to create a delivery request.' });
    }
    // Optional: Verify sender_id exists
    const senderExists = await Sender.findByPk(sender_id);
    if (!senderExists) {
         return res.status(404).json({ message: `Sender with ID ${sender_id} not found.` });
    }
    // ---------------------------------------------

    const delivery = await DeliveryRequest.create({ sender_id, ...deliveryData });

    // --- Notify Sender about successful request creation ---
     try {
        await Notification.create({
            sender_id: delivery.sender_id,
            message: `Your delivery request #${delivery.id} has been created successfully.`,
            type: 'delivery_created',
            related_entity_id: delivery.id,
            related_entity_type: 'DeliveryRequest'
        });
         // Optionally: Notify relevant admins/dispatchers (requires more logic)
    } catch (notificationError) {
        console.error("Failed to create notification for delivery creation:", notificationError);
    }
    // --------------------------------------------------

    res.status(201).json(delivery);
  } catch (err) {
    console.error("Create Delivery Error:", err);
    res.status(500).json({ message: 'Delivery creation failed', error: err.message });
  }
};

// Update dynamic pricing (No changes needed regarding Sender/Notification)
export const updatePricing = async (req, res) => {
  try {
    // Use findOrCreate with default values or findByPk(1) if you're sure it exists
    const [pricing, created] = await DynamicPricing.findOrCreate({
        where: { id: 1 }, // Assuming a single row for pricing config with ID 1
        defaults: req.body // Set defaults if creating for the first time
    });

    if (!created) { // If it was found, update it
        await pricing.update(req.body);
    }

    res.status(200).json({ message: `Pricing ${created ? 'created' : 'updated'}`, pricing });
  } catch (err) {
     console.error("Update Pricing Error:", err);
    res.status(500).json({ message: 'Pricing update failed', error: err.message });
  }
};
