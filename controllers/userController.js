import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
// Register a new user with hashed password
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, status, agent, referral_code } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let referredById = null;

    if (referral_code) {
      const referrer = await User.findOne({ where: { referral_code } });
      if (!referrer || !referrer.agent) {
        return res.status(400).json({ success: false, message: 'Invalid referral code.' });
      }
      referredById = referrer.id;
    }

    // Auto-generate referral code if agent
    const generatedReferralCode = agent ? crypto.randomBytes(4).toString('hex') : null;

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      status: status || 'Inactive',
      agent: agent || false,
      referral_code: generatedReferralCode,
      referred_by: referredById,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ success: false, message: 'An error occurred while registering.' });
  }
};

// Get user by ID (secured endpoint, requires token)
export const getUserById = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Only return referral_code if user is an agent
    const responseData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      agent: user.agent,
      lastsignin: user.lastsignin,
    };

    if (user.agent) {
      responseData.referral_code = user.referral_code;
    }

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// Update user details
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, password, status } = req.body;

    const user = await User.findByPk(req.params.id);  // Get user by ID
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updatedUser = await user.update({
      name: name || user.name,
      email: email ? email.toLowerCase() : user.email,  // Ensure email is in lowercase
      phone: phone || user.phone,
      password: password ? await bcrypt.hash(password, 10) : user.password,  // Hash password if provided
      status: status || user.status,
    });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating user.' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);  // Find user by ID
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.destroy();  // Delete user from the database
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting user.' });
  }
};
