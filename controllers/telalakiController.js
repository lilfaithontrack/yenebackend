// controllers/
import db from '../models/index.js'; // assumes Sequelize is initialized in models/index.js
const { Telalaki, sequelize } = db;
import { QueryTypes } from 'sequelize';

export const createTelalaki = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.body;

    const delivery = await Telalaki.create({
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      status: 'pending',
    });

    res.status(201).json(delivery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
};

export const findMatchingTelalaki = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.query;
    const radius = 5000;

    const results = await sequelize.query(`
      SELECT * FROM Telalakis
      WHERE status = 'on_the_way'
        AND ST_Distance_Sphere(
              POINT(pickup_lng, pickup_lat),
              POINT(:pickupLng, :pickupLat)
            ) < :radius
        AND ST_Distance_Sphere(
              POINT(dropoff_lng, dropoff_lat),
              POINT(:dropoffLng, :dropoffLat)
            ) < :radius
    `, {
      type: QueryTypes.SELECT,
      replacements: {
        pickupLat: parseFloat(pickup_lat),
        pickupLng: parseFloat(pickup_lng),
        dropoffLat: parseFloat(dropoff_lat),
        dropoffLng: parseFloat(dropoff_lng),
        radius,
      },
    });

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to find matches' });
  }
};
