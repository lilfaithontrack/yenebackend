import path from 'path';
import multer from 'multer';
import AddProduct from '../models/AddProduct.js';
import CatItem from '../models/CatItem.js';
import SubCat from '../models/SubCat.js';

// Multer configuration for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/product'); // Directory to store product images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Save with unique filename
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept only image files
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: fileFilter,
});

// Create a new product
export const createProduct = [
  upload.single('image'), // Middleware to handle file upload
  async (req, res) => {
    const { title, sku, color, size, brand, price, description, catItemId, subCatId, quantity } = req.body;

    try {
      // Validate image upload
      if (!req.file) {
        return res.status(400).json({ error: 'Product image is required' });
      }

      const image = req.file.path; // Path to the uploaded image

      // Validate category and subcategory
      const catItem = await CatItem.findByPk(catItemId);
      const subCat = await SubCat.findByPk(subCatId);

      if (!catItem || !subCat) {
        return res.status(404).json({ error: 'Invalid category or subcategory' });
      }

      // Create the product
      const product = await AddProduct.create({
        title,
        sku,
        color,
        size,
        brand,
        price,
        description,
        catItemId,
        subCatId,
        quantity,
        image,
      });

      res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  },
];

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await AddProduct.findAll({
      include: [
        { model: CatItem, attributes: ['name'] },
        { model: SubCat, attributes: ['name'] },
      ],
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await AddProduct.findByPk(id, {
      include: [
        { model: CatItem, attributes: ['name'] },
        { model: SubCat, attributes: ['name'] },
      ],
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Update a product
export const updateProduct = [
  upload.single('image'), // Middleware to handle file upload
  async (req, res) => {
    const { id } = req.params;
    const { title, sku, color, size, brand, price, description, catItemId, subCatId, quantity } = req.body;

    try {
      // Validate image upload if provided
      let updatedImage = undefined;
      if (req.file) {
        updatedImage = req.file.path;
      }

      // Find the product
      const product = await AddProduct.findByPk(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Update the product
      await product.update({
        title,
        sku,
        color,
        size,
        brand,
        price,
        description,
        catItemId,
        subCatId,
        quantity,
        image: updatedImage || product.image, // Use the new image if provided
      });

      res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  },
];

// Delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the product
    const product = await AddProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete the product
    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
