import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Register a new user with hashed password
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, status } = req.body;

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword, // Store hashed password
      status: status || 'Inactive',  // Default to 'Inactive' if no status is provided
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ success: false, message: 'An error occurred while registering.' });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalize email to lowercase for case-insensitive login
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Compare hashed password with input password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1y' });

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        lastsignin: user.lastsignin,
      },
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login.' });
  }
};

// Get user by ID (secured endpoint, requires token)
export const getUserById = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Extract the token from the header
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token

    const userId = decoded.id; // Get user ID from the token
    const user = await User.findByPk(userId); // Fetch the user from the database

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
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
