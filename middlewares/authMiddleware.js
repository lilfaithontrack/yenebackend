// Example: middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import { Sender } from '../models/Telalaki.js'; // Adjust path to your models file
// Import your error response helper if you have one
// import { sendErrorResponse } from '../controllers/helpers.js'; // Adjust path

// Make sure JWT_SECRET is loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function (if not imported)
const sendErrorResponse = (res, statusCode, message) => {
    console.error(`Error ${statusCode}: ${message}`);
    res.status(statusCode).json({ message });
};


export const protectSender = async (req, res, next) => {
  let token;
  console.log('>>> Protect Middleware: Checking authentication...'); // Debug log

  // 1. Check for Authorization header and Bearer token format
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
      console.log('>>> Protect Middleware: Token found.'); // Debug log

      // 3. Verify the token using your secret key
      // This checks signature and expiration
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('>>> Protect Middleware: Token verified, decoded payload:', decoded); // Debug log

      // 4. Use ID from token payload to find the sender in the database
      //    The property name in 'decoded' (e.g., 'id', 'senderId') depends on
      //    what you put in the payload when you *created* the token during login.
      //    IMPORTANT: Exclude sensitive fields like the PIN!
      const loggedInSender = await Sender.findByPk(decoded.id, { // Assuming payload has 'id'
        attributes: { exclude: ['pin'] } // Exclude sensitive data
      });

      if (!loggedInSender) {
         console.error('>>> Protect Middleware: Sender not found for ID in token:', decoded.id);
         // Changed from sendErrorResponse to just calling next() without attaching user
         // This allows the controller to potentially handle 'user not found' differently if needed,
         // or you can send the 401 directly here. If sending 401, use 'return'.
         // return sendErrorResponse(res, 401, 'Not authorized, user associated with token not found.');
         // Calling next() without req.sender will cause the controller check to fail with "User context not found"
         return next();
      }

      // 5. Attach the fetched sender object to the request object
      //    Controllers downstream can now access req.sender
      req.sender = loggedInSender;
      console.log('>>> Protect Middleware: Sender context attached to req.sender.'); // Debug log

      next(); // Token is valid, user found, proceed to the next middleware/controller

    } catch (error) {
      // Handle errors during token verification (expired, invalid signature etc.)
      console.error('>>> Protect Middleware: Token verification failed!', error.message);
      return sendErrorResponse(res, 401, 'Not authorized, token failed or expired.');
    }
  }

  // If the header is missing or not in 'Bearer <token>' format
  if (!token) {
    console.log('>>> Protect Middleware: No valid Bearer token found in header.');
    return sendErrorResponse(res, 401, 'Not authorized, no token provided.');
  }
};
