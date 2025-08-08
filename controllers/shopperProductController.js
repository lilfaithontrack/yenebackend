import ShopperProduct from '../models/shopperProduct.js';
import Shopper from '../models/Shopper.js';
import sequelize from '../db/dbConnect.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs/promises';

/**
 * =================================================================================
 * API USAGE GUIDE (IMPORTANT FOR FRONTEND)
 * =================================================================================
 * This controller expects 'multipart/form-data'. An authentication token (JWT)
 * providing `req.user.id` is required for all create, update, delete, and
 * shop-specific "get" operations.
 *
 * --- For Creating/Updating Products ---
 * * FIELDS: title, price, description, brand, etc.
 * * JSON STRINGS: `variations`, `color_options` must be JSON strings.
 * * IMAGES: All image files are sent under the field name 'images'.
 * =================================================================================
 */

// --- FILE HANDLING & STORAGE SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
}).array('images', 20);

// --- CORE CRUD FUNCTIONS (CREATE, UPDATE, DELETE) ---

export const createProduct = async (req, res) => {
  try {
    const {
      title, price, description, brand, catItems, subcat, productfor, stock,
      variations: variationsJSON,
      color_options: colorOptionsJSON,
      general_image_count,
      location_name, coordinates: coordinatesJSON, location_radius
    } = req.body;

    const allNewImagePaths = await processUploadedImages(req.files);
    const generalImageCount = parseInt(general_image_count, 10) || 0;
    
    const generalImages = allNewImagePaths.slice(0, generalImageCount);
    let color_options_data = colorOptionsJSON ? JSON.parse(colorOptionsJSON) : [];

    let currentIndex = generalImageCount;
    color_options_data.forEach(option => {
      const imageCountForColor = option.image_count || 0;
      option.images = allNewImagePaths.slice(currentIndex, currentIndex + imageCountForColor);
      currentIndex += imageCountForColor;
      delete option.image_count;
    });

    const variations = variationsJSON ? JSON.parse(variationsJSON) : [];
    let geoData = coordinatesJSON ? JSON.parse(coordinatesJSON) : null;
    if (geoData && geoData.lat && geoData.lng) {
      geoData = { type: 'Point', coordinates: [geoData.lng, geoData.lat] };
    }

    const product = await ShopperProduct.create({
      shopper_id: req.user.id,
      title, price, description, brand, catItems, subcat, productfor, stock,
      status: 'pending',
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

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      existingImages: existingImagesJSON,
      variations: variationsJSON,
      coordinates: coordinatesJSON,
      ...updateData
    } = req.body;

    // ✅ Find product by ID
    const product = await ShopperProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // =====================
    // 📌 Handle Images
    // =====================
    let finalImages = [];

    // Keep existing images
    if (existingImagesJSON) {
      try {
        const existingImages = JSON.parse(existingImagesJSON);
        if (Array.isArray(existingImages)) {
          finalImages = [...existingImages];
        }
      } catch (err) {
        console.error('Error parsing existing images:', err);
      }
    }

    // Add new uploaded images
    if (req.files?.images) {
      const uploadedFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      for (const file of uploadedFiles) {
        try {
          const imagePath = await uploadFile(file);
          finalImages.push(imagePath);
        } catch (err) {
          console.error('Error uploading new image:', err);
        }
      }
    }

    // =====================
    // 📌 Handle Color Options
    // =====================
    let colorOptions = [];
    if (updateData.color_options) {
      try {
        colorOptions = JSON.parse(updateData.color_options);
        const colorOptionsCount = parseInt(updateData.color_options_count || '0');

        for (let i = 0; i < colorOptionsCount; i++) {
          const colorImages = req.files?.[`color_images_${i}`];
          if (colorImages) {
            const images = Array.isArray(colorImages) ? colorImages : [colorImages];
            const uploadedPaths = await Promise.all(images.map(uploadFile));
            if (colorOptions[i]) {
              colorOptions[i].images = uploadedPaths;
            }
          }
        }
      } catch (err) {
        console.error('Error processing color options:', err);
      }
    }

    // =====================
    // 📌 Prepare Update Fields
    // =====================
    const updateFields = {
      ...updateData,
      image: JSON.stringify(finalImages),
      color_options: JSON.stringify(colorOptions)
    };

    if (variationsJSON) {
      updateFields.variations = variationsJSON;
    }

    if (coordinatesJSON) {
      try {
        const geoData = JSON.parse(coordinatesJSON);
        if (geoData?.lat && geoData?.lng) {
          updateFields.coordinates = {
            type: 'Point',
            coordinates: [geoData.lng, geoData.lat]
          };
        }
      } catch (err) {
        console.error('Error parsing coordinates:', err);
      }
    }

    // =====================
    // 📌 Update Product
    // =====================
    await product.update(updateFields);

    // Delete unused images from storage
    try {
      const oldImages = JSON.parse(product.image || '[]');
      const imagesToDelete = oldImages.filter(oldImage => !finalImages.includes(oldImage));
      for (const imageToDelete of imagesToDelete) {
        await deleteFile(imageToDelete);
      }
    } catch (err) {
      console.error('Error deleting old images:', err);
    }

    const updatedProduct = await ShopperProduct.findByPk(id);
    return res.status(200).json(updatedProduct);

  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// =====================
// 📌 Helper Functions
// =====================
const uploadFile = async (file) => {
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
  const path = `/uploads/${fileName}`;
  await file.mv(`./public${path}`);
  return path;
};

const deleteFile = async (filePath) => {
  const fullPath = `./public${filePath}`;
  await fs.unlink(fullPath);
};
export const deleteProduct = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
  try {
    const { id } = req.params;
    const product = await ShopperProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.shopper_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden. You do not have permission to delete this product.' });
    }
    
    // --- FIX STARTS HERE ---
    
    // 1. Safely parse color_options if it's a string, otherwise use it as is.
    const colorOptions = typeof product.color_options === 'string'
      ? JSON.parse(product.color_options)
      : product.color_options;

    // 2. Build the list of images to delete using the parsed array.
    const imagesToDelete = [
      ...(product.image || []),
      // Ensure colorOptions is an array before calling flatMap
      ...(Array.isArray(colorOptions) ? colorOptions.flatMap(option => option.images || []) : [])
    ];
    
    // --- FIX ENDS HERE ---

    if (imagesToDelete.length > 0) {
        await deleteUploadedImages(imagesToDelete);
    }

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully!' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
};

// --- PUBLIC "READ" FUNCTIONS ---

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
    const where = { status: 'approved' };
    if (subcat) where.subcat = subcat;
    if (mode) where.productfor = mode;

    const products = await ShopperProduct.findAll({ where });
    res.status(200).json(shuffleArray(products));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

export const getAllPendingProducts = async (req, res) => {
  try {
    const { subcat, mode } = req.query;
    const where = { status: 'pending' };
    if (subcat) where.subcat = subcat;
    if (mode) where.productfor = mode;

    const products = await ShopperProduct.findAll({ where });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching pending products:', error);
    res.status(500).json({ message: 'Failed to fetch pending products' });
  }
};
 export const getAllApprovedProducts = async (req, res) => {
  try {
    const { subcat, mode } = req.query;

    // Base condition: only approved products
    const where = { status: 'approved' };

    // Optional filters
    if (subcat) where.subcat = subcat;
    if (mode) where.productfor = mode;

    const products = await ShopperProduct.findAll({ where });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching approved products:', error);
    res.status(500).json({ message: 'Failed to fetch approved products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ShopperProduct.findByPk(id, {
        include: {
            model: Shopper,
            as: 'seller',
            attributes: ['id', 'full_name']
        }
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Failed to fetch product by ID.' });
  }
};

export const getProductsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const products = await sequelize.query(`
      SELECT * FROM shopper_products
      WHERE status = 'approved' AND ST_DWithin(
        coordinates,
        ST_MakePoint(?, ?)::geography,
        ?
      )
    `, {
      replacements: [lng, lat, radius * 1000],
      type: sequelize.QueryTypes.SELECT,
      model: ShopperProduct,
      mapToModel: true
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({ message: 'Failed to search by location' });
  }
};


// --- SHOPPER-SPECIFIC "READ" FUNCTIONS ---

export const getMyShopApprovedProducts = async (req, res) => {
  try {
    const products = await ShopperProduct.findAll({
      where: {
        shopper_id: req.user.id,
        status: 'approved'
      },
      order: [['updated_at', 'DESC']]
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching approved products for shopper:', error);
    res.status(500).json({ message: 'Failed to fetch your approved products.', error: error.message });
  }
};

export const getMyShopPendingProducts = async (req, res) => {
  try {
    const products = await ShopperProduct.findAll({
      where: {
        shopper_id: req.user.id,
        status: 'pending'
      },
      order: [['created_at', 'DESC']]
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching pending products for shopper:', error);
    res.status(500).json({ message: 'Failed to fetch your pending products.', error: error.message });
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
export const getAllMyProducts = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const products = await ShopperProduct.findAll({
      where: {
        shopper_id: req.user.id
      },
      order: [['updated_at', 'DESC']]
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching all products for shopper:', error);
    res.status(500).json({ message: 'Failed to fetch your products.', error: error.message });
  }
};
export const getMyShopProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the product by ID and ensure it belongs to the authenticated user
    const product = await ShopperProduct.findOne({
      where: {
        id,
        shopper_id: req.user.id
      },
      include: {
        model: Shopper,
        as: 'seller',
        attributes: ['id', 'full_name']
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or access denied.' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by ID for current shopper:', error);
    res.status(500).json({ message: 'Failed to fetch product.', error: error.message });
  }
};


