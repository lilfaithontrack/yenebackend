import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Joi from 'joi';
import QRCode from 'qrcode';
import Payment from '../models/Payment.js';

// Ensure the uploads directory exists
const uploadDir = 'uploads/screenshots';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype);
    isValid ? cb(null, true) : cb(new Error('Only jpeg, jpg, or png images are allowed.'));
  },
}).single('payment_screenshot');

// Joi schema for request validation
const paymentSchema = Joi.object({
  guest_id: Joi.string().optional(),
  payment_method: Joi.string().default('Bank Transfer'),
  cart_items: Joi.string().required(),
  total_price: Joi.number().required(),
  service_fee: Joi.number().default(0),
  delivery_fee: Joi.number().default(0),
  shipping_address: Joi.string().required(),
  customer_name: Joi.string().required(),
  customer_email: Joi.string().email().required(),
  customer_phone: Joi.string().required(),
});

// Create a new payment
const createPayment = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'Payment screenshot is required.' });

    const { error, value } = paymentSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let parsedCartItems;
    try {
      parsedCartItems = JSON.parse(value.cart_items);
    } catch {
      return res.status(400).json({ message: 'Invalid cart items format.' });
    }

    try {
      const payment = await Payment.create({
        ...value,
        cart_items: parsedCartItems,
        payment_screenshot: req.file.path,
        payment_status: 'Pending',
      });

      return res.status(201).json({ message: 'Payment created successfully.', payment });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
};

// Update payment status (Approve, Decline, Pending, Completed, Failed)
const updatePaymentStatus = async (req, res) => {
  const { payment_id } = req.params;
  const { payment_status } = req.body;

  if (!['Pending', 'Completed', 'Failed', 'Approved', 'Declined'].includes(payment_status)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  try {
    const payment = await Payment.findByPk(payment_id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    payment.payment_status = payment_status;
    await payment.save();

    return res.status(200).json({ message: 'Payment status updated successfully.', payment });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Assign order to shopper/delivery & generate QR code
const sendOrderToShopperAndDelivery = async (req, res) => {
  const { payment_id } = req.params;
  const { shopper_id, delivery_id } = req.body;

  if (!shopper_id || !delivery_id) {
    return res.status(400).json({ message: 'Shopper ID and Delivery ID are required.' });
  }

  try {
    const payment = await Payment.findByPk(payment_id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    if (payment.payment_status !== 'Approved') {
      return res.status(400).json({ message: 'Order must be approved before assigning.' });
    }

    const qrData = JSON.stringify({
      payment_id: payment.id,
      customer_name: payment.customer_name,
      total_price: payment.total_price,
    });
    const qrCode = await QRCode.toDataURL(qrData);

    payment.shopper_id = shopper_id;
    payment.delivery_id = delivery_id;
    payment.qr_code = qrCode;
    payment.payment_status = 'Pending Delivery';
    await payment.save();

    return res.status(200).json({ message: 'Order assigned successfully.', payment });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get order history (by customer_email or guest_id)
const getOrderHistory = async (req, res) => {
  const { customer_email, guest_id } = req.query;

  if (!customer_email && !guest_id) {
    return res.status(400).json({ message: 'Customer email or guest ID is required.' });
  }

  try {
    const orders = await Payment.findAll({
      where: customer_email ? { customer_email } : { guest_id },
      order: [['createdAt', 'DESC']],
    });

    if (!orders.length) return res.status(404).json({ message: 'No orders found.' });

    res.status(200).json({ message: 'Order history retrieved successfully.', orders });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a single payment order by ID
const getPaymentOrderById = async (req, res) => {
  const { payment_id } = req.params;

  try {
    const payment = await Payment.findByPk(payment_id);
    if (!payment) return res.status(404).json({ message: 'Payment order not found.' });

    let parsedCartItems;
    try {
      parsedCartItems = JSON.parse(payment.cart_items);
    } catch {
      return res.status(500).json({ message: 'Invalid cart items format in database.' });
    }

    return res.status(200).json({
      message: 'Payment order retrieved successfully.',
      payment: { ...payment.toJSON(), cart_items: parsedCartItems },
    });
  } catch (error) {
    console.error('Error fetching payment order:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Fetch all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Payment.findAll({ order: [['createdAt', 'DESC']] });

    if (!orders.length) return res.status(404).json({ message: 'No orders found.' });

    res.status(200).json({ message: 'All orders retrieved successfully.', orders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export {
  createPayment,
  updatePaymentStatus,
  sendOrderToShopperAndDelivery,
  getOrderHistory,
  getPaymentOrderById,
  getAllOrders,
};
