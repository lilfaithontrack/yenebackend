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

// Backend part of handling existing images in update request
export const updateProduct = async (req, res) => {
  try {
    const { title, price, description, brand, size, sku, color, seller_email, catItems, subcat, existingImages } = req.body;
    const productId = req.params.id;

    // Fetch the existing product
    const existingProduct = await AddProduct.findByPk(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Ensure existingProduct.image is an array
    let imageArray = [];
    if (existingProduct.image) {
      try {
        imageArray = JSON.parse(existingProduct.image); // Parse JSON string
      } catch (error) {
        console.warn('Error parsing existing images from database:', error);
        imageArray = []; // Default to empty array if parsing fails
      }
    }

    // Handle existing images from request
    if (existingImages) {
      if (typeof existingImages === 'string') {
        try {
          imageArray = JSON.parse(existingImages);
        } catch (error) {
          console.warn('Error parsing existingImages from request:', error);
        }
      } else if (Array.isArray(existingImages)) {
        imageArray = existingImages;
      }
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const optimizedPath = path.join(__dirname, '../uploads', `${Date.now()}-${file.originalname}.webp`);
        await sharp(file.buffer)
          .resize(800)
          .webp({ quality: 80 })
          .toFile(optimizedPath);

        imageArray.push(`/uploads/${path.basename(optimizedPath)}`);
      }
    }

    // Update the product
    const updatedProduct = await AddProduct.update(
      {
        title: title || existingProduct.title,
        price: price || existingProduct.price,
        description: description || existingProduct.description,
        brand: brand || existingProduct.brand,
        size: size || existingProduct.size,
        sku: sku || existingProduct.sku,
        color: color || existingProduct.color,
        seller_email: seller_email || existingProduct.seller_email,
        catItems: catItems || existingProduct.catItems,
        subcat: subcat || existingProduct.subcat,
        image: JSON.stringify(imageArray), // Convert back to JSON string for storage
      },
      {
        where: { id: productId },
      }
    );

    if (updatedProduct[0] === 0) {
      return res.status(404).json({ message: 'Failed to update product' });
    }

    res.status(200).json({ message: 'Product updated successfully', updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

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
