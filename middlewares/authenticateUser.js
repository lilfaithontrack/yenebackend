import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Import your role-specific models
import Admin  from '../models/Admin.js'; 
import Shopper from '../models/Shopper.js';
import Delivery from '../models/Delivery.js';

dotenv.config(); // Load environment variables

const authenticateUser = (roles = []) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from the header

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Unauthorized.' });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Determine the model to query based on the user's role
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

      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // If roles array is provided, check if the user's role is allowed to access the resource
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied. Forbidden.' });
      }

      req.user = decoded; // Attach decoded user info to the request object
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Authentication error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Invalid token. Unauthorized.' });
      }
      return res.status(500).json({ message: 'Internal server error.' });
    }
  };
};

export default authenticateUser;
