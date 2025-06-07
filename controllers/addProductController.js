import Product from '../models/AddProduct.js'; // CORRECTED: Using your file name 'AddProduct.js'
import sequelize from '../db/dbConnect.js';   // Required for the raw SQL query in getProductsByLocation
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs/promises';

/**
 * =================================================================================
 * API USAGE GUIDE (IMPORTANT FOR FRONTEND)
 * =================================================================================
 * This controller expects 'multipart/form-data'.
 *
 * --- For Creating/Updating Products ---
 * * REQUIRED FIELDS IN THE REQUEST BODY:
 * - title, price, brand, description, catItems, subcat, etc.
 * - variations: A JSON STRING of the variations array.
 * e.g., '[{"size":"L", "price":25.99, "stock":"in_stock", "color":"Red"}]'
 *
 * * FOR IMAGE UPLOADS:
 * - All new image files must be sent under a single field name: 'images'.
 * - general_image_count: A number indicating how many of the first uploaded files are for the main 'image' gallery.
 * - color_options: A JSON STRING of the color options array. Each object MUST have an 'image_count'
 * property indicating how many uploaded files belong to that color.
 * e.g., '[{"color_name":"Red", "image_count":2}, {"color_name":"Blue", "image_count":1}]'
 *
 * * The order of files sent in the 'images' field must match: general images first, then images for each color in order.
 * =================================================================================
 */

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads in memory
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
}).array('images', 20); // Expect all files under the 'images' field name

// CREATE a new product
export const createProduct = async (req, res) => {
  try {
    const {
      title, price, description, brand, catItems, subcat, productfor,stock,
      variations: variationsJSON,
      color_options: colorOptionsJSON,
      general_image_count,
      location_name, coordinates: coordinatesJSON, location_radius
    } = req.body;

    // 1. Process and sort uploaded images
    const allNewImagePaths = await processUploadedImages(req.files);
    const generalImageCount = parseInt(general_image_count, 10) || 0;
    
    const generalImages = allNewImagePaths.slice(0, generalImageCount);
    let color_options_data = colorOptionsJSON ? JSON.parse(colorOptionsJSON) : [];

    let currentIndex = generalImageCount;
    color_options_data.forEach(option => {
      const imageCountForColor = option.image_count || 0;
      option.images = allNewImagePaths.slice(currentIndex, currentIndex + imageCountForColor);
      currentIndex += imageCountForColor;
    });

    // 2. Parse other JSON fields
    const variations = variationsJSON ? JSON.parse(variationsJSON) : [];
    let geoData = coordinatesJSON ? JSON.parse(coordinatesJSON) : null;
    if (geoData && geoData.lat && geoData.lng) {
      geoData = { type: 'Point', coordinates: [geoData.lng, geoData.lat] };
    }

    // 3. Create product with the new, correct model structure
    const product = await Product.create({
      title, price, description, brand, catItems, subcat, productfor,stock,
      status: 'pending', // Default status
      image: generalImages,
      color_options: color_options_data,
      variations,
      location_name,
      coordinates: geoData,
      location_radius,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// UPDATE a product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      existingImages: existingImagesJSON,
      general_image_count,
      color_options: colorOptionsJSON,
      variations: variationsJSON,
      coordinates: coordinatesJSON,
      ...updateData
    } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 1. Determine which old images to delete
    const oldImages = [...product.image, ...product.color_options.flatMap(opt => opt.images)];
    const existingImagesToKeep = existingImagesJSON ? JSON.parse(existingImagesJSON) : [];
    const imagesToDelete = oldImages.filter(img => !existingImagesToKeep.includes(img));
    await deleteUploadedImages(imagesToDelete);

    // 2. Process newly uploaded images
    const newImagePaths = await processUploadedImages(req.files);

    // 3. Prepare the final update payload
    const updateFields = { ...updateData };
    
    // Logic to reconstruct image arrays if new images were uploaded
    if (newImagePaths.length > 0) {
        const generalImageCount = parseInt(general_image_count, 10) || 0;
        const newGeneralImages = newImagePaths.slice(0, generalImageCount);
        const newColorImages = newImagePaths.slice(generalImageCount);
        
        let color_options_data = colorOptionsJSON ? JSON.parse(colorOptionsJSON) : [];
        let colorImageIndex = 0;
        color_options_data.forEach(option => {
            const imageCountForColor = option.image_count || 0;
            // This example replaces images for a color option if new ones are uploaded for it
            option.images = newColorImages.slice(colorImageIndex, colorImageIndex + imageCountForColor);
            colorImageIndex += imageCountForColor;
        });
        
        // Combine kept images with new ones
        updateFields.image = [...existingImagesToKeep.filter(img => product.image.includes(img)), ...newGeneralImages];
        updateFields.color_options = color_options_data;
    } else if (colorOptionsJSON) {
        // If no new images, just update the text metadata
        updateFields.color_options = JSON.parse(colorOptionsJSON);
    }
    
    if (variationsJSON) {
      updateFields.variations = JSON.parse(variationsJSON);
    }
    if (coordinatesJSON) {
        const geoData = JSON.parse(coordinatesJSON);
        if (geoData && geoData.lat && geoData.lng) {
            updateFields.coordinates = { type: 'Point', coordinates: [geoData.lng, geoData.lat] };
        }
    }
    
    // 4. Update the product in the database
    await product.update(updateFields);
    const updatedProduct = await Product.findByPk(id);
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// DELETE a product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const imagesToDelete = [
      ...product.image,
      ...product.color_options.flatMap(option => option.images)
    ];
    await deleteUploadedImages(imagesToDelete);

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully!' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
};


// --- READ-ONLY AND LOCATION FUNCTIONS ---

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const getAllProducts = async (req, res) => {
  try {
    const { subcat, mode } = req.query;
    const where = {};
    if (subcat) where.subcat = subcat;
    if (mode) where.productfor = mode;

    const products = await Product.findAll({ where });
    res.status(200).json(shuffleArray(products));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

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

export const getProductsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const products = await sequelize.query(`
      SELECT * FROM products
      WHERE status = 'approved' AND ST_DWithin(
        coordinates,
        ST_MakePoint(?, ?)::geography,
        ?
      )
    `, {
      replacements: [lng, lat, radius * 1000], // distance in meters
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


// --- HELPER FUNCTIONS ---

async function processUploadedImages(files) {
  if (!files || files.length === 0) return [];
  
  const imageUploadPromises = files.map(file => {
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
    const filepath = path.join(__dirname, '../uploads', filename);
    
    return sharp(file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filepath)
      .then(() => `/uploads/${filename}`);
  });

  return Promise.all(imageUploadPromises);
}

async function deleteUploadedImages(imagePaths) {
  if (!imagePaths || imagePaths.length === 0) return;
  
  const deletePromises = imagePaths.map(imagePath => {
    if(!imagePath) return Promise.resolve();
    const fullPath = path.join(__dirname, '..', imagePath);
    return fs.unlink(fullPath).catch(err => console.error(`Failed to delete image: ${fullPath}`, err));
  });

  await Promise.all(deletePromises);
}
