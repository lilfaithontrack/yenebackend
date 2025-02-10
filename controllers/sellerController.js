import Seller from '../models/Seller.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import multer from 'multer'; // Import multer for file uploads
import path from 'path';

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid name conflicts
  },
});

export const upload = multer({ storage });

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
      image: req.file ? req.file.filename : null, // Handle image upload
      license_file: req.file ? req.file.filename : null, // Handle license file upload
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
      expiresIn: '1y',
    });

    res.status(200).json({
      success: true,
      token,
      data: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        image: seller.image,
        license_file: seller.license_file,
      },
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

    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    // Update seller details, hash password if a new one is provided
    const updatedSeller = await seller.update({
      name: name || seller.name,
      email: email || seller.email,
      phone: phone || seller.phone,
      password: password ? await bcrypt.hash(password, 10) : seller.password,
      image: req.file ? req.file.filename : seller.image, // Update image if new file provided
      license_file: req.file ? req.file.filename : seller.license_file, // Update license file if new file provided
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

// Get seller by ID
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
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email user
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// Generate a reset password token and send it to the user
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Find seller by email
    const seller = await Seller.findOne({ where: { email } });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found with that email.',
      });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Save the reset token and its expiration time (1 hour validity)
    seller.reset_token = resetToken;
    seller.reset_token_expiry = Date.now() + 3600000; // Token expires in 1 hour
    await seller.save();

    // Construct the reset password URL (adjust according to your front-end routing)
    const resetUrl = `http://yourdomain.com/reset-password/${resetToken}`;

    // Send the reset password email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: seller.email,
      subject: 'Password Reset Request',
      html: `<p>To reset your password, click on the following link:</p>
             <a href="${resetUrl}">Reset Password</a>
             <p>If you didn't request this, please ignore this email.</p>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send email.',
        });
      }
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully.',
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reset password using the token
export const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    // Find the seller by reset token
    const seller = await Seller.findOne({ where: { reset_token: resetToken } });
    if (!seller || seller.reset_token_expiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the seller's password and clear reset token fields
    seller.password = hashedPassword;
    seller.reset_token = null;
    seller.reset_token_expiry = null;
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
