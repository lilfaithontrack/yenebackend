import bcrypt from 'bcrypt';
import DeliveryBoy from '../models/DeliveryBoy.js';

// Create a new delivery boy
export const createDeliveryBoy = async (req, res) => {
  try {
    const { full_name, email, location, password } = req.body;

    // Validate input
    if (!full_name || !email || !location || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if email already exists
    const existingDeliveryBoy = await DeliveryBoy.findOne({ where: { email } });
    if (existingDeliveryBoy) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new delivery boy
    const newDeliveryBoy = await DeliveryBoy.create({
      full_name,
      email,
      location,
      password: hashedPassword,
    });

    res.status(201).json({
      message: 'Delivery boy created successfully.',
      deliveryBoy: { id: newDeliveryBoy.id, full_name, email, location },
    });
  } catch (error) {
    console.error('Error creating delivery boy:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get all delivery boys
export const getAllDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.findAll();
    res.status(200).json({ deliveryBoys });
  } catch (error) {
    console.error('Error fetching delivery boys:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a single delivery boy by ID
export const getDeliveryBoyById = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryBoy = await DeliveryBoy.findByPk(id);

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found.' });
    }

    res.status(200).json({ deliveryBoy });
  } catch (error) {
    console.error('Error fetching delivery boy:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update a delivery boy
export const updateDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, location, password } = req.body;

    const deliveryBoy = await DeliveryBoy.findByPk(id);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found.' });
    }

    // Hash the new password if provided
    let hashedPassword = deliveryBoy.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update fields
    await deliveryBoy.update({
      full_name: full_name || deliveryBoy.full_name,
      email: email || deliveryBoy.email,
      location: location || deliveryBoy.location,
      password: hashedPassword,
    });

    res.status(200).json({ message: 'Delivery boy updated successfully.', deliveryBoy });
  } catch (error) {
    console.error('Error updating delivery boy:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete a delivery boy
export const deleteDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryBoy = await DeliveryBoy.findByPk(id);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found.' });
    }

    await deliveryBoy.destroy();
    res.status(200).json({ message: 'Delivery boy deleted successfully.' });
  } catch (error) {
    console.error('Error deleting delivery boy:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
