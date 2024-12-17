import bcrypt from 'bcrypt';
import Shopper from '../models/Shopper.js';

// Create a new shopper
export const createShopper = async (req, res) => {
  try {
    const { full_name, email, location, password } = req.body;

    // Validate input
    if (!full_name || !email || !location || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if email already exists
    const existingShopper = await Shopper.findOne({ where: { email } });
    if (existingShopper) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new shopper
    const newShopper = await Shopper.create({
      full_name,
      email,
      location,
      password: hashedPassword,
    });

    res.status(201).json({
      message: 'Shopper created successfully.',
      shopper: { id: newShopper.id, full_name, email, location },
    });
  } catch (error) {
    console.error('Error creating shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get all shoppers
export const getAllShoppers = async (req, res) => {
  try {
    const shoppers = await Shopper.findAll();
    res.status(200).json({ shoppers });
  } catch (error) {
    console.error('Error fetching shoppers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a single shopper by ID
export const getShopperById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopper = await Shopper.findByPk(id);

    if (!shopper) {
      return res.status(404).json({ message: 'Shopper not found.' });
    }

    res.status(200).json({ shopper });
  } catch (error) {
    console.error('Error fetching shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update a shopper
export const updateShopper = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, location, password } = req.body;

    const shopper = await Shopper.findByPk(id);
    if (!shopper) {
      return res.status(404).json({ message: 'Shopper not found.' });
    }

    // Hash the new password if provided
    let hashedPassword = shopper.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update fields
    await shopper.update({
      full_name: full_name || shopper.full_name,
      email: email || shopper.email,
      location: location || shopper.location,
      password: hashedPassword,
    });

    res.status(200).json({ message: 'Shopper updated successfully.', shopper });
  } catch (error) {
    console.error('Error updating shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete a shopper
export const deleteShopper = async (req, res) => {
  try {
    const { id } = req.params;

    const shopper = await Shopper.findByPk(id);
    if (!shopper) {
      return res.status(404).json({ message: 'Shopper not found.' });
    }

    await shopper.destroy();
    res.status(200).json({ message: 'Shopper deleted successfully.' });
  } catch (error) {
    console.error('Error deleting shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
