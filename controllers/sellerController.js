import Seller from '../models/Seller.js'; // Ensure the path is correct
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Import JWT for token generation

// Seller registration
// Seller registration
export const registerSeller = async (req, res) => {
  try {
    const { name, lname, email, phone, password, address, region, sub_city, woreda, liyu_name, liyu_sign, home_phone, tin_num, bank_name, account_number, national_id, commerce1, commerce2, tin_doc } = req.body;

    // Check if the seller already exists
    const existingSeller = await Seller.findOne({ where: { email } });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'Seller already exists with this email.',
      });
    }

    const seller = await Seller.create({
      name,
      lname,
      email,
      phone,
      password, // Save the password in plaintext for testing (not recommended)
      address,
      region,
      sub_city,
      woreda,
      liyu_name,
      liyu_sign,
      home_phone,
      tin_num,
      bank_name,
      account_number,
      national_id,
      verification: 0,
      image: req.body.image || 'admin1.jpg',
      commerce1,
      commerce2,
      tin_doc,
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

    // Compare passwords directly (note: this should be a plain-text comparison)
    // Replace the hashed password logic with a direct comparison for testing
    if (seller.password !== password) {
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
        lname: seller.lname,
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
    const { name, lname, email, phone, password, address, region, sub_city, woreda, liyu_name, liyu_sign, home_phone, tin_num, bank_name, account_number, national_id, commerce1, commerce2, tin_doc } = req.body;

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
      lname: lname || seller.lname,
      email: email || seller.email,
      phone: phone || seller.phone,
      password: password ? await bcrypt.hash(password, 10) : seller.password, // Hash if new password provided
      address: address || seller.address,
      region: region || seller.region,
      sub_city: sub_city || seller.sub_city,
      woreda: woreda || seller.woreda,
      liyu_name: liyu_name || seller.liyu_name,
      liyu_sign: liyu_sign || seller.liyu_sign,
      home_phone: home_phone || seller.home_phone,
      tin_num: tin_num || seller.tin_num,
      bank_name: bank_name || seller.bank_name,
      account_number: account_number || seller.account_number,
      national_id: national_id || seller.national_id,
      commerce1: commerce1 || seller.commerce1,
      commerce2: commerce2 || seller.commerce2,
      tin_doc: tin_doc || seller.tin_doc,
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
