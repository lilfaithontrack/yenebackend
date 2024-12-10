import multer from 'multer';
import path from 'path';
import Payment from '../models/Payment.js';
import fs from 'fs';
import Joi from 'joi';

// Ensure the uploads directory exists
if (!fs.existsSync('uploads/screenshots')) {
  fs.mkdirSync('uploads/screenshots', { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/screenshots');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images with jpeg, jpg, or png formats are allowed.'));
    }
  },
}).single('payment_screenshot');

// Joi schema for request validation
const paymentSchema = Joi.object({
  guest_id: Joi.string().optional(),
  payment_method: Joi.string().default('Bank Transfer'),
  cart_items: Joi.string().required(),
  total_price: Joi.number().required(),
  shipping_address: Joi.string().required(),
  customer_name: Joi.string().required(),
  customer_email: Joi.string().email().required(),
  customer_phone: Joi.string().required(),
});

// Create a payment
const createPayment = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Payment screenshot is required.' });
      }

      const { error, value } = paymentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      // Parse cart_items
      let parsedCartItems;
      try {
        parsedCartItems = JSON.parse(value.cart_items);
      } catch (err) {
        return res.status(400).json({ message: 'Invalid cart items format.' });
      }

      const payment = await Payment.create({
        ...value,
        cart_items: parsedCartItems,
        payment_screenshot: req.file.path,
        payment_status: 'Pending',
      });

      return res.status(201).json({
        message: 'Payment created successfully.',
        payment,
      });
    });
  } catch (error) {
    console.error('Error creating payment:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors.map(err => err.message) });
    }

    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update payment status (Approve, Decline, Pending, Completed, Failed)
const updatePaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { payment_status } = req.body;

    const validStatuses = ['Pending', 'Completed', 'Failed', 'Approved', 'Declined'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ message: 'Invalid payment status.' });
    }

    const payment = await Payment.findByPk(payment_id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    payment.payment_status = payment_status;
    await payment.save();

    return res.status(200).json({
      message: 'Payment status updated successfully.',
      payment,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Fetch order history (by customer_email or guest_id)
const getOrderHistory = async (req, res) => {
  try {
    const { customer_email, guest_id } = req.query;

    if (!customer_email && !guest_id) {
      return res.status(400).json({ message: 'Customer email or guest ID is required.' });
    }

    // Fetch orders based on customer_email or guest_id
    const orders = await Payment.findAll({
      where: customer_email
        ? { customer_email } // For registered users
        : { guest_id },      // For guest users
      order: [['createdAt', 'DESC']], // Sort orders by most recent
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found.' });
    }

    res.status(200).json({ message: 'Order history retrieved successfully.', orders });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Fetch all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Payment.findAll({
      order: [['createdAt', 'DESC']], // Sort orders by most recent
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found.' });
    }

    res.status(200).json({ message: 'All orders retrieved successfully.', orders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export { createPayment, updatePaymentStatus, getOrderHistory, getAllOrders };

