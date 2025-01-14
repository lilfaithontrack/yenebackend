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

export const updateProduct = async (req, res) => {
  try {
    const { title, price, description, brand, size, sku, color, seller_email, catItems, subcat, existingImages } = req.body;

    // Start with the existing images (if any)
    let imageArray = [];

    // Ensure existingImages is parsed correctly and cleaned
    if (existingImages) {
      try {
        // Remove any extra quotes or escape characters if present
        const cleanedExistingImages = existingImages.replace(/^"|"$/g, ''); // Remove extra quotes
        imageArray = JSON.parse(cleanedExistingImages); // Now parse the cleaned string into an array
        
        // Ensure it's an array and has the correct format
        if (!Array.isArray(imageArray)) {
          throw new Error("Existing images must be an array");
        }
      } catch (error) {
        console.warn("Error parsing existingImages:", error);
        imageArray = []; // If parsing fails, start with an empty array
      }
    }

    // Handle new images if provided
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files;
      
      // Add new images to the existing image array
      for (const file of uploadedImages) {
        const optimizedPath = path.join(__dirname, '../uploads', `${Date.now()}-${file.originalname}.webp`);

        // Optimize and save the image
        await sharp(file.buffer)
          .resize(800)
          .webp({ quality: 80 })
          .toFile(optimizedPath); // Save image to the disk

        // Add optimized image path to the array
        imageArray.push(`/uploads/${path.basename(optimizedPath)}`);
      }
    }

    // Save the image array as a JSON string in the database
    const updatedProduct = await AddProduct.update(
      {
        title,
        price,
        description,
        brand,
        size,
        sku,
        color,
        seller_email,
        catItems,
        subcat,
        image: JSON.stringify(imageArray)  // Save the updated array of images as a JSON string
      },
      {
        where: { id: req.params.id }, // Update the product by ID
      }
    );

    if (updatedProduct[0] === 0) { // If no rows were updated, the product ID might be incorrect
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error("Error updating product:", error);
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
