import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Adjust the import according to your model

export const authenticateUser = (requiredRoles = []) => {
  return async (req, res, next) => {
    // Get token from Authorization header
    const token = req.headers['authorization'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Ensure token is in the format "Bearer <token>"
    if (!token.startsWith('Bearer ')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format. Token must start with "Bearer "',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
      req.user = decoded; // Attach user info from token

      // Check if the user exists in the database
      const user = await User.findByPk(req.user.id); // Assuming the user ID is in the token
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.',
        });
      }

      // Check for role authorization if required roles are specified
      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to perform this action.',
        });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Authentication error:', error); // Log the error for debugging
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token or token expired.',
        });
      } else if (error instanceof jwt.NotBeforeError) {
        return res.status(400).json({
          success: false,
          message: 'Token is not active yet.',
        });
      } else if (error instanceof jwt.TokenExpiredError) {
        return res.status(400).json({
          success: false,
          message: 'Token has expired.',
        });
      } else {
        // Handle any other unforeseen errors
        return res.status(500).json({
          success: false,
          message: 'Server error during token verification.',
        });
      }
    }
  };
};
