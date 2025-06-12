import Shopper from '../models/Shopper.js';
import jwt from 'jsonwebtoken';

export const verifyShopper = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // this should include shopper's ID
    next();
  } catch (err) {
    console.error('Invalid session:', err.message);
    return res.status(403).json({ message: 'Invalid session' });
  }
};

