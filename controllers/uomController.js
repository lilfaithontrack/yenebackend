import UOM from '../models/UOM.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ==== Multer Configuration (Inline) ====
const uploadPath = 'uploads/uoms';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

export const uomUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, png, and webp files are allowed'));
  },
});

// ==== Controller Functions ====



export const getUOMsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const uoms = await UOM.findAll({ where: { product_id: productId } });
    res.status(200).json(uoms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching UOMs.' });
  }
};

export const updateUOM = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await UOM.findByPk(id);
    if (!existing) return res.status(404).json({ message: 'UOM not found.' });

    const image_url = req.file ? `/uploads/uoms/${req.file.filename}` : existing.image_url;

    await UOM.update(
      { ...req.body, image_url },
      { whexport const createUOM = async (req, res) => {
  console.log('--- createUOM ---'); // Log when the function is hit
  try {
    const { product_id, type, value, price, stock } = req.body;
    console.log('req.body:', req.body); // Log the text fields

    if (!product_id || !type || !value || !price || !stock) {
      console.log('Validation failed: Missing required fields.');
      return res.status(400).json({ message: 'All fields are required.' });
    }

    console.log('req.file (from multer):', req.file); // THIS IS VERY IMPORTANT!

    const image_url = req.file ? `/uploads/uoms/${req.file.filename}` : null;
    console.log('Constructed image_url for database:', image_url);

    const uomDataToCreate = {
      product_id,
      type,
      value,
      price,
      stock,
      image_url, // Ensure this is the correct field name as per your UOM model
    };
    console.log('Data being passed to UOM.create():', uomDataToCreate);

    const uom = await UOM.create(uomDataToCreate);
    console.log('UOM object created by Sequelize (from DB):', JSON.stringify(uom, null, 2)); // Log the created object

    res.status(201).json(uom);
  } catch (err) {
    console.error('--- ERROR in createUOM ---');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    // If it's a Sequelize validation error, it might have more details
    if (err.errors && err.errors.length > 0) {
        console.error('Sequelize Validation Errors:', err.errors.map(e => e.message));
    }
    res.status(500).json({ message: 'Server error creating UOM.' });
  }
};ere: { id } }
    );

    const updatedUOM = await UOM.findByPk(id);
    res.status(200).json(updatedUOM);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating UOM.' });
  }
};

export const deleteUOM = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UOM.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ message: 'UOM not found.' });

    res.status(200).json({ message: 'UOM deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting UOM.' });
  }
};
