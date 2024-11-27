import Checkout from '../models/Checkout.js';
import Cart from '../models/Cart.js'; // Assuming Cart model is imported

// Create a new checkout
export const createCheckout = async (req, res) => {
    const {
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      shippingAddress: shipping_address,
      totalPrice: total_price,
    } = req.body;
  
    // Validate required fields
    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !total_price) {
      return res.status(400).json({
        message: 'All fields (customer_name, customer_email, customer_phone, shipping_address, total_price) are required.',
      });
    }
  
    try {
      const newCheckout = await Checkout.create({
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        total_price,
      });
  
      res.status(201).json({ message: 'Checkout created successfully', checkout: newCheckout });
    } catch (error) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ message: 'Error creating checkout', error: error.message });
    }
  };
  

  
// Get all checkouts
export const getAllCheckouts = async (req, res) => {
  try {
    const checkouts = await Checkout.findAll({
      include: [{
        model: Cart,
        as: 'carts', // Make sure to define association in Cart model if needed
        attributes: ['id', 'product_id', 'quantity', 'price'],
      }]
    });

    res.status(200).json(checkouts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching checkouts', error: error.message });
  }
};

// Get a specific checkout by ID
export const getCheckoutById = async (req, res) => {
  const { id } = req.params;

  try {
    const checkout = await Checkout.findByPk(id, {
      include: [{
        model: Cart,
        as: 'carts',
        attributes: ['id', 'product_id', 'quantity', 'price'],
      }]
    });

    if (!checkout) {
      return res.status(404).json({ message: `Checkout with ID ${id} not found` });
    }

    res.status(200).json(checkout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching checkout', error: error.message });
  }
};

// Update checkout status (payment or order status)
export const updateCheckoutStatus = async (req, res) => {
  const { id } = req.params;
  const { payment_status, order_status } = req.body;

  try {
    const checkout = await Checkout.findByPk(id);

    if (!checkout) {
      return res.status(404).json({ message: `Checkout with ID ${id} not found` });
    }

    if (payment_status) checkout.payment_status = payment_status;
    if (order_status) checkout.order_status = order_status;

    await checkout.save();

    res.status(200).json({ message: 'Checkout status updated successfully', checkout });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating checkout status', error: error.message });
  }
};

// Delete a checkout
export const deleteCheckout = async (req, res) => {
  const { id } = req.params;

  try {
    const checkout = await Checkout.findByPk(id);

    if (!checkout) {
      return res.status(404).json({ message: `Checkout with ID ${id} not found` });
    }

    await checkout.destroy();

    res.status(200).json({ message: 'Checkout deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting checkout', error: error.message });
  }
};
