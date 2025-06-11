import bcrypt from 'bcrypt';
import Shopper from '../models/Shopper.js';
import { v4 as uuidv4 } from 'uuid';

// Haversine formula to calculate distance between two points (lat/lng)
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Create a new shopper
export const createShopper = async (req, res) => {
  try {
    const { full_name, email, location_lat, location_lng, password } = req.body;

    // Validate input
    if (!full_name || !email || !location_lat || !location_lng || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if email already exists
    const existingShopper = await Shopper.findOne({ where: { email } });
    if (existingShopper) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new shopper
    const newShopper = await Shopper.create({
      full_name,
      email,
      location_lat,
      location_lng,
      password: hashedPassword,
    });

    res.status(201).json({
      message: 'Shopper created successfully.',
      shopper: { id: newShopper.id, full_name, email, location_lat, location_lng },
    });
  } catch (error) {
    console.error('Error creating shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get all shoppers
export const getAllShoppers = async (req, res) => {
  try {
    const shoppers = await Shopper.findAll();
    res.status(200).json({ shoppers });
  } catch (error) {
    console.error('Error fetching shoppers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a single shopper by ID
export const getShopperById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopper = await Shopper.findByPk(id);

    if (!shopper) {
      return res.status(404).json({ message: 'Shopper not found.' });
    }

    res.status(200).json({ shopper });
  } catch (error) {
    console.error('Error fetching shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update a shopper
export const updateShopper = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, location_lat, location_lng, password } = req.body;

    const shopper = await Shopper.findByPk(id);
    if (!shopper) {
      return res.status(404).json({ message: 'Shopper not found.' });
    }

    // Hash the new password if provided
    let hashedPassword = shopper.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update fields
    await shopper.update({
      full_name: full_name || shopper.full_name,
      email: email || shopper.email,
      location_lat: location_lat || shopper.location_lat,
      location_lng: location_lng || shopper.location_lng,
      password: hashedPassword,
    });

    res.status(200).json({ message: 'Shopper updated successfully.', shopper });
  } catch (error) {
    console.error('Error updating shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete a shopper
export const deleteShopper = async (req, res) => {
  try {
    const { id } = req.params;

    const shopper = await Shopper.findByPk(id);
    if (!shopper) {
      return res.status(404).json({ message: 'Shopper not found.' });
    }

    await shopper.destroy();
    res.status(200).json({ message: 'Shopper deleted successfully.' });
  } catch (error) {
    console.error('Error deleting shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Shopper Login function
export const loginShopper = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check if shopper exists
    const shopper = await Shopper.findOne({ where: { email } });
    if (!shopper) {
      return res.status(404).json({ message: 'Shopper not found.' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, shopper.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // Generate a new session token
    const sessionToken = uuidv4();
    await shopper.update({ session_token: sessionToken });

    // Return session token and shopper info
    const { id, full_name, location_lat, location_lng } = shopper;
    res.status(200).json({
      message: 'Login successful.',
      token: sessionToken,
      shopper: { id, full_name, email, location_lat, location_lng },
    });
  } catch (error) {
    console.error('Error logging in shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
// Find nearby shoppers within a specified radius (e.g., 10 km)
export const findNearbyShoppers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query; // default radius is 10 km

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    // Find all shoppers and calculate the distance from the given coordinates
    const shoppers = await Shopper.findAll();

    const nearbyShoppers = shoppers.filter(shopper => {
      const distance = haversine(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(shopper.location_lat),
        parseFloat(shopper.location_lng)
      );
      return distance <= radius;
    });

    res.status(200).json({ message: `${nearbyShoppers.length} nearby shoppers found.`, nearbyShoppers });
  } catch (error) {
    console.error('Error finding nearby shoppers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
