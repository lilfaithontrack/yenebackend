import Shopper from '../models/Shopper.js';

export const verifyShopper = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Find shopper with matching session token
    const shopper = await Shopper.findOne({ where: { session_token: token } });

    if (!shopper) {
      return res.status(401).json({ message: 'Invalid or expired session token' });
    }

    req.shopper = shopper; // Attach full shopper object to request
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
