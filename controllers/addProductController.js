import AddProduct from '../models/AddProduct.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs/promises';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware for file uploads
const storage = multer.memoryStorage(); // Use memory storage for image optimization
export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type.'), false);
    }
  },
});

// Controller functions

/**
 * Fetch all products, with optional filtering by subcategory (subcat)
 */
export const getAllProducts = async (req, res) => {
  try {
    const { subcat } = req.query;

    // Fetch all products or filter by subcat
    const query = subcat ? { where: { subcat } } : {};
    const products = await AddProduct.findAll(query);

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

/**
 * Fetch product by ID
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await AddProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Failed to fetch product by ID.' });
  }
};

/**
 * Create a new product with optimized images
 */
export const createProduct = async (req, res) => {
  try {
    const { title, sku, color, size, brand, price, description, catItems, subcat, seller_email } = req.body;

    // Optimize and save images
    const images = [];
    if (req.files) {
      for (const file of req.files) {
        const optimizedPath = path.join(__dirname, '../uploads', `${Date.now()}-${file.originalname}.webp`);

        await sharp(file.buffer)
          .resize(800) // Resize to 800px width
          .webp({ quality: 80 }) // Convert to WebP
          .toFile(optimizedPath);

        images.push(`/uploads/${path.basename(optimizedPath)}`);
      }
    }

    const newProduct = await AddProduct.create({
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
      image: images,
    });

    res.status(201).json({ message: 'Product created successfully!', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error });
  }
};

/**
 * Update an existing product with new images
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, sku, color, size, brand, price, description, catItems, subcat, seller_email, existingImages } = req.body;

    // Find the existing product
    const product = await AddProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Initialize array for new images
    const newImages = [];

    // Optimize and save new images if they exist
    if (req.files) {
      for (const file of req.files) {
        const optimizedPath = path.join(__dirname, "../uploads", `${Date.now()}-${file.originalname}.webp`);

        await sharp(file.buffer)
          .resize(800) // Resize to 800px width
          .webp({ quality: 80 }) // Convert to WebP
          .toFile(optimizedPath);

        newImages.push(`/uploads/${path.basename(optimizedPath)}`);
      }
    }

    // If new images are provided, combine them with the old ones
    const updatedImages = existingImages ? [...existingImages, ...newImages] : newImages;

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
      image: updatedImages, // Update the image array with the combined result
    };

    // Update product in the database
    await product.update(updatedData);

    // Optionally: delete old images if they are no longer used (implementation depends on your needs)
    if (existingImages) {
      const imagePathsToDelete = existingImages.filter(img => !updatedImages.includes(img));
      imagePathsToDelete.forEach((imgPath) => {
        const filePath = path.join(__dirname, "..", imgPath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Delete the old image file
        }
      });
    }

    res.status(200).json({ message: "Product updated successfully!", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product." });
  }
};
/**
 * Delete a product and its associated images
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await AddProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Delete associated image files
    for (const imagePath of product.image) {
      const filePath = path.join(__dirname, '..', imagePath);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting file:', filePath, err);
      }
    }

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully!' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
};
