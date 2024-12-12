import AddProduct from '../models/AddProduct.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware for file uploads
import multer from 'multer';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
export const upload = multer({ storage });

// Controller functions
export const getAllProducts = async (req, res) => {
  try {
    const products = await AddProduct.findAll();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

export const addProduct = async (req, res) => {
  try {
    const { title, sku, color, size, brand, price, description, catItems, subcat, seller_email } = req.body;

    const productData = {
      title,
      sku,
      color,
      size,
      brand,
      price,
      description,
      catItems,
      subcat,
      seller_email,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    };

    const newProduct = await AddProduct.create(productData);
    res.status(201).json({ message: 'Product added successfully!', product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Failed to add product.' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, sku, color, size, brand, price, description, catItems, subcat, seller_email } = req.body;

    const product = await AddProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const updatedData = {
      title,
      sku,
      color,
      size,
      brand,
      price,
      description,
      catItems,
      subcat,
      seller_email,
      ...(req.file && { image: `/uploads/${req.file.filename}` }),
    };

    await product.update(updatedData);
    res.status(200).json({ message: 'Product updated successfully!', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product.' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await AddProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully!' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
};
