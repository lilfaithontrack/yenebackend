import { CatItem, Subcat } from '../models/Associations.js';
import multer from 'multer';

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Create a new CatItem with associated Subcats
const createCatItem = async (req, res) => {
  try {
    const { name, subcatIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'CatItem name is required' });
    }

    if (!subcatIds || !Array.isArray(subcatIds)) {
      return res.status(400).json({ message: 'Subcategory IDs must be an array' });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Create the CatItem
    const catItem = await CatItem.create({ name, image: imageUrl });

    // Associate the CatItem with the Subcats
    const subcats = await Subcat.findAll({ where: { id: subcatIds } });
    await catItem.setSubcats(subcats);

    res.status(201).json({
      message: 'CatItem created successfully',
      catItem,
    });
  } catch (error) {
    console.error('Error creating CatItem:', error);
    res.status(500).json({
      message: 'Error creating CatItem',
      error: error.message,
    });
  }
};

// Get all CatItems with their associated Subcats
const getAllCatItems = async (req, res) => {
  try {
    const catItems = await CatItem.findAll({
      include: {
        model: Subcat,
        as: 'subcats',
        attributes: ['id', 'name'], // Include specific fields
        through: { attributes: [] }, // Exclude join table fields
      },
    });

    res.status(200).json(catItems);
  } catch (error) {
    console.error('Error fetching CatItems:', error);
    res.status(500).json({
      message: 'Error fetching CatItems',
      error: error.message,
    });
  }
};

// Other CRUD functions remain mostly similar, updating `setSubcats` for associations

export { upload, createCatItem, getAllCatItems };
