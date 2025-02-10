import Seller from '../models/Seller.js'; // Ensure the path is correct
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Import JWT for token generation


// Seller registration
export const registerSeller = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if the seller already exists
    const existingSeller = await Seller.findOne({ where: { email } });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'Seller already exists with this email.',
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const seller = await Seller.create({
      name,
      email,
      phone,
      password: hashedPassword, // Store hashed password
      image: req.body.image || null, // Optional image
    });

    res.status(201).json({
      success: true,
      data: seller,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Seller login
export const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find seller by email
    const seller = await Seller.findOne({ where: { email } });
    if (!seller) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, seller.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token with 1 year expiration
    const token = jwt.sign({ id: seller.id }, process.env.JWT_SECRET, {
      expiresIn: '1y', // Token expiration time
    });

    res.status(200).json({
      success: true,
      token, // Send token in response
      data: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        image: seller.image,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all sellers
export const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.findAll();
    res.status(200).json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a seller by ID
export const getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    res.status(200).json({
      success: true,
      data: seller,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update seller details
export const updateSeller = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Find seller by ID
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    // Update seller details, only hash password if a new one is provided
    const updatedSeller = await seller.update({
      name: name || seller.name,
      email: email || seller.email,
      phone: phone || seller.phone,
      password: password ? await bcrypt.hash(password, 10) : seller.password, // Hash if new password provided
      image: req.body.image || seller.image, // Optional image update
    });

    res.status(200).json({
      success: true,
      data: updatedSeller,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a seller
export const deleteSeller = async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    await seller.destroy();
    res.status(200).json({
      success: true,
      message: 'Seller deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
