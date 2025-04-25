import db from '../models/Telalaki.js';
const { User, Vehicle, Driver, AdminApproval, DeliveryRequest, DynamicPricing } = db;

// Register driver (with or without vehicle)
export const registerDriver = async (req, res) => {
  try {
    const { user, driver, vehicle } = req.body;

    const newUser = await User.create(user);

    const newDriver = await Driver.create({
      ...driver,
      user_id: newUser.id,
    });

    if (!driver.is_owner && vehicle) {
      await Vehicle.create(vehicle);
    }

    await AdminApproval.create({ driver_id: newDriver.id });

    res.status(201).json({ message: 'Driver registered and pending approval.' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// Admin approves/rejects driver
export const updateApproval = async (req, res) => {
  try {
    const { driver_id, status, reason } = req.body;

    const approval = await AdminApproval.findOne({ where: { driver_id } });
    if (!approval) return res.status(404).json({ message: 'Approval not found' });

    approval.status = status;
    approval.approved_at = status === 'approved' ? new Date() : null;
    approval.rejected_reason = status === 'rejected' ? reason : null;

    await approval.save();

    res.status(200).json({ message: `Driver ${status}.` });
  } catch (err) {
    res.status(500).json({ message: 'Approval update failed', error: err.message });
  }
};

// Submit payment proof (either screenshot or receipt link)
export const submitPaymentProof = async (req, res) => {
  try {
    const { delivery_id, payment_proof_url, receipt_link } = req.body;

    const delivery = await DeliveryRequest.findByPk(delivery_id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

    delivery.payment_method = 'screenshot';
    delivery.payment_proof_url = payment_proof_url || null;
    delivery.receipt_link = receipt_link || null;
    delivery.is_payment_approved = false;

    if (!payment_proof_url && !receipt_link) {
      return res.status(400).json({ message: 'Either a screenshot URL or receipt link is required.' });
    }

    await delivery.save();
    res.status(200).json({ message: 'Payment info submitted. Waiting for admin approval.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit payment info', error: err.message });
  }
};

// Admin approves screenshot payment
export const adminApprovePayment = async (req, res) => {
  try {
    const { delivery_id } = req.body;

    const delivery = await DeliveryRequest.findByPk(delivery_id);
    if (!delivery || delivery.payment_method !== 'screenshot') {
      return res.status(400).json({ message: 'Invalid payment approval' });
    }

    delivery.is_payment_approved = true;
    delivery.approved_by = 'admin';
    await delivery.save();

    res.status(200).json({ message: 'Payment approved by admin' });
  } catch (err) {
    res.status(500).json({ message: 'Admin approval failed', error: err.message });
  }
};

// Driver approves cash payment
export const driverApproveCash = async (req, res) => {
  try {
    const { delivery_id } = req.body;

    const delivery = await DeliveryRequest.findByPk(delivery_id);
    if (!delivery || delivery.payment_method !== 'cash') {
      return res.status(400).json({ message: 'Invalid payment approval' });
    }

    delivery.is_payment_approved = true;
    delivery.approved_by = 'driver';
    await delivery.save();

    res.status(200).json({ message: 'Cash payment approved by driver' });
  } catch (err) {
    res.status(500).json({ message: 'Driver approval failed', error: err.message });
  }
};

// Create delivery request
export const createDelivery = async (req, res) => {
  try {
    const delivery = await DeliveryRequest.create(req.body);
    res.status(201).json(delivery);
  } catch (err) {
    res.status(500).json({ message: 'Delivery creation failed', error: err.message });
  }
};

// Update dynamic pricing
export const updatePricing = async (req, res) => {
  try {
    const [pricing, created] = await DynamicPricing.findOrCreate({ where: { id: 1 } });
    await pricing.update(req.body);
    res.status(200).json({ message: 'Pricing updated', pricing });
  } catch (err) {
    res.status(500).json({ message: 'Pricing update failed', error: err.message });
  }
};
