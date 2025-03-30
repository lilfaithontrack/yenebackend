import Product from '../models/Product.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs/promises';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

export const createProduct = async (req, res) => {
  try {
    const { 
      title, price, description, brand, size, color,
      catItems, subcat, unit_of_measurement, stock,
      // Location fields
      location_type, location_name, coordinates, location_radius,
      location_prices, location_stock
    } = req.body;

    // Process images
    const images = await processUploadedImages(req.files);

    // Parse coordinates if provided
    let geoData = null;
    if (coordinates) {
      try {
        const { lat, lng } = JSON.parse(coordinates);
        geoData = { type: 'Point', coordinates: [lng, lat] };
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }

    // Create product
    const product = await Product.create({
      title,
      price,
      description,
      brand,
      size,
      color,
      catItems,
      subcat,
      unit_of_measurement,
      stock: stock || 'in_stock',
      status: 'approved',
      image: images,
      // Location data
      location_type: location_type || 'region',
      location_name,
      coordinates: geoData,
      location_radius: location_radius ? parseFloat(location_radius) : null,
      location_prices: location_prices ? JSON.parse(location_prices) : {},
      location_stock: location_stock ? JSON.parse(location_stock) : {}
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

/**
 * Update product with location data
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      existingImages, 
      coordinates,  // Expects { lat, lng } object
      ...updateData 
    } = req.body;

    // Handle images
    let images = parseExistingImages(existingImages);
    if (req.files) {
      const newImages = await processUploadedImages(req.files);
      images = [...images, ...newImages];
    }

    // Prepare update object
    const updateFields = {
      ...updateData,
      image: images
    };

    // Process coordinates if provided
    if (coordinates) {
      try {
        const { lat, lng } = JSON.parse(coordinates);
        updateFields.coordinates = { type: 'Point', coordinates: [lng, lat] };
        updateFields.location_type = updateData.location_name ? 'hybrid' : 'coordinates';
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }

    // Handle JSON fields
    if (updateData.location_prices) {
      updateFields.location_prices = JSON.parse(updateData.location_prices);
    }
    if (updateData.location_stock) {
      updateFields.location_stock = JSON.parse(updateData.location_stock);
    }

    const [updated] = await Product.update(updateFields, { where: { id } });

    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await Product.findByPk(id);
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

/**
 * Get products by location (radius search)
 */
export const getProductsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in km
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const products = await sequelize.query(`
      SELECT *, 
      ST_Distance_Sphere(
        POINT(?, ?),
        coordinates
      ) / 1000 AS distance
      FROM products
      WHERE ST_Distance_Sphere(
        POINT(?, ?),
        coordinates
      ) <= ? * 1000
      AND status = 'approved'
      ORDER BY distance
    `, {
      replacements: [lng, lat, lng, lat, radius],
      type: sequelize.QueryTypes.SELECT,
      model: Product,
      mapToModel: true
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({ message: 'Failed to search by location' });
  }
};

/**
 * Get price for specific location
 */
export const getLocationPrice = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { location } = req.query;
    const price = product.location_prices[location] || product.price;
    
    res.status(200).json({ price });
  } catch (error) {
    console.error('Error fetching location price:', error);
    res.status(500).json({ message: 'Failed to get location price' });
  }
};

/**
 * Update location-specific price
 */
export const updateLocationPrice = async (req, res) => {
  try {
    const { id, location } = req.params;
    const { price } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const locationPrices = { ...product.location_prices };
    locationPrices[location] = parseFloat(price);
    
    await product.update({ location_prices: locationPrices });
    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating location price:', error);
    res.status(500).json({ message: 'Failed to update location price' });
  }
};

// ======================
// HELPER FUNCTIONS
// ======================

async function processUploadedImages(files) {
  if (!files || files.length === 0) return [];
  
  const images = [];
  for (const file of files) {
    const filename = `${Date.now()}-${file.originalname}.webp`;
    const filepath = path.join(__dirname, '../uploads', filename);
    
    await sharp(file.buffer)
      .resize(800)
      .webp({ quality: 80 })
      .toFile(filepath);
    
    images.push(`/uploads/${filename}`);
  }
  return images;
}

function parseExistingImages(images) {
  if (!images) return [];
  return Array.isArray(images) ? images : JSON.parse(images || '[]');
}

async function deleteProductImages(imagePaths) {
  if (!imagePaths || imagePaths.length === 0) return;
  
  for (const imagePath of imagePaths) {
    try {
      const fullPath = path.join(__dirname, '..', imagePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    console.log(products); // Check if products are fetched
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

 
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Format coordinates if they exist
    const response = product.toJSON();
    if (product.coordinates) {
      response.coordinates = {
        lat: product.coordinates.coordinates[1],
        lng: product.coordinates.coordinates[0]
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Failed to fetch product by ID.' });
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
