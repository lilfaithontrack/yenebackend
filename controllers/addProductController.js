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
    const { title, sku, color, size, brand, price, description, catItems, subcat, seller_email, unit_of_measurement, productfor, location_prices } = req.body;
    const status = 'approved'; // Admin uploads are approved immediately

    // Handle images
    const images = [];
    if (req.files) {
      for (const file of req.files) {
        const optimizedPath = path.join(__dirname, '../uploads', `${Date.now()}-${file.originalname}.webp`);
        await sharp(file.buffer).resize(800).webp({ quality: 80 }).toFile(optimizedPath);
        images.push(`/uploads/${path.basename(optimizedPath)}`);
      }
    }

    // Create the product with location-based price if available
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
      unit_of_measurement, 
      status, 
      productfor, 
      image: images,
      location_prices: location_prices || {},  // Use location_prices from the request or default to empty
    });

    res.status(201).json({ message: 'Product created successfully!', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};


// Backend part of handling existing images in update request
export const updateProduct = async (req, res) => {
  try {
    const { title, price, description, brand, size, sku, color, seller_email, catItems, subcat, status, unit_of_measurement, existingImages, stock, productfor, location_prices } = req.body; // Include location_prices

    let imageArray = Array.isArray(existingImages) ? existingImages : JSON.parse(existingImages || '[]');

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const optimizedPath = path.join(__dirname, '../uploads', `${Date.now()}-${file.originalname}.webp`);
        await sharp(file.buffer).resize(800).webp({ quality: 80 }).toFile(optimizedPath);
        imageArray.push(`/uploads/${path.basename(optimizedPath)}`);
      }
    }

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
        status, 
        unit_of_measurement, 
        image: imageArray, 
        stock,
        productfor,
        location_prices: location_prices || {}, // Update the location_prices field
      },
      { where: { id: req.params.id } }
    );

    if (updatedProduct[0] === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// update for the seller producct 

export const updateProductForSeller = async (req, res) => {
  try {
    const { title, price, description, brand, size, sku, color, catItems, subcat, existingImages } = req.body;
    
    let imageArray = [];

    // Handle existing images (parse from string if needed)
    if (existingImages) {
      if (typeof existingImages === 'string') {
        try {
          imageArray = JSON.parse(existingImages);
        } catch (error) {
          console.warn('Error parsing existingImages:', error);
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

    // Update the product with status set to 'pending' (requires re-approval)
    const updatedProduct = await AddProduct.update(
      {
        title,
        price,
        description,
        brand,
        size,
        sku,
        color,
        catItems,
        subcat,
        status: 'pending', // Seller updates require re-approval
        image: imageArray,
      },
      {
        where: { id: req.params.id },
      }
    );

    if (updatedProduct[0] === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully, awaiting admin approval.' });
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


// create product for the seller
export const createProductForSeller = async (req, res) => {
  try {
    const { title, sku, color, size, brand, price, description, catItems, subcat, seller_email } = req.body;

    // Set status to 'pending' for seller uploads
    const status = 'pending';

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
      status,  // Set status as 'pending'
      image: images,
    });

    res.status(201).json({ message: 'Product uploaded successfully, waiting for approval.', product: newProduct });
  } catch (error) {
    console.error('Error uploading product for approval:', error);
    res.status(500).json({ message: 'Failed to upload product for approval', error });
  }
};
// approval for the seller created product

export const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the product by ID
    const product = await AddProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check if the product is already approved or not
    if (product.status === 'approved') {
      return res.status(400).json({ message: 'Product is already approved.' });
    }

    // Update the status to 'approved'
    product.status = 'approved';
    await product.save();

    res.status(200).json({ message: 'Product approved successfully!', product });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({ message: 'Failed to approve product', error });
  }
};

//get approved product 

export const getApprovedProducts = async (req, res) => {
  try {
    const products = await AddProduct.findAll({
      where: { status: 'approved' } // Fetch only approved products
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching approved products:', error);
    res.status(500).json({ message: 'Failed to fetch approved products' });
  }
};

export const getProductsBySellerEmail = async (req, res) => {
  try {
    const { seller_email } = req.params; // Get seller_email from request params

    const products = await AddProduct.findAll({
      where: { seller_email } // Filter products by seller_email
    });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found for this seller.' });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ message: 'Failed to fetch seller products.' });
  }
};

