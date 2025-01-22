import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Import role-specific models
import Admin from '../models/Admin.js';
import Shopper from '../models/Shopper.js';
import Delivery from '../models/Delivery.js';

dotenv.config(); // Load environment variables

// Middleware to authenticate users based on role
const authenticateUser = (roles = []) => {
  return async (req, res, next) => {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Unauthorized.' });
    }
  
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      // Dynamically choose the model based on the user's role
      let user;
      switch (decoded.role) {
        case 'admin':
          user = await Admin.findOne({ where: { id: decoded.id } });
          break;
        case 'shopper':
          user = await Shopper.findOne({ where: { id: decoded.id } });
          break;
        case 'delivery':
          user = await Delivery.findOne({ where: { id: decoded.id } });
          break;
        default:
          return res.status(403).json({ message: 'Access denied. Forbidden.' });
      }

      // If the user is not found for the given role
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Check if the user's role matches the required roles
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied. Forbidden.' });
      }

      // Attach user information to the request object
      req.user = decoded;

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Authentication error:', error);

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Invalid token. Unauthorized.' });
      } else if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: 'Token expired. Please log in again.' });
      }

      return res.status(500).json({ message: 'Internal server error.' });
    }
  };
};

export default authenticateUser;
