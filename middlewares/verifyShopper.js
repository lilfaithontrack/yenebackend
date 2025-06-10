// middleware/verifyShopper.js
import jwt from 'jsonwebtoken';
import Shopper from '../models/Shopper.js';

export const verifyShopper = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const shopper = await Shopper.findByPk(decoded.id);

    if (!shopper) {
      return res.status(403).json({ message: 'Shopper not found' });
    }

    req.shopper = shopper;
    next();
  } catch (err) {
    console.error('Shopper auth error:', err);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
