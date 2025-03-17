import SellerProduct from '../models/SellerProduct.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type.'), false);
    }
  },
});
// Create Seller Product (Always Pending)
export const createSellerProduct = async (req, res) => {
  try {
    const { title, sku, color, size, brand, price, description, catItems, subcat, seller_email, bank, account_number, unit_of_measurement, stock } = req.body;

    const images = [];
    if (req.files) {
      for (const file of req.files) {
        const optimizedPath = path.join(__dirname, '../uploads', `${Date.now()}-${file.originalname}.webp`);

        await sharp(file.buffer)
          .resize(800)
          .webp({ quality: 80 })
          .toFile(optimizedPath);

        images.push(`/uploads/${path.basename(optimizedPath)}`);
      }
    }

    const newProduct = await SellerProduct.create({
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
      bank,
      account_number,
      stock,
      unit_of_measurement,
      
      status: 'pending', // Always pending
      image: images,
    });

    res.status(201).json({ message: 'Product uploaded successfully, awaiting approval.', product: newProduct });
  } catch (error) {
    console.error('Error uploading seller product:', error);
    res.status(500).json({ message: 'Failed to upload seller product', error });
  }
};
// update the seller prodcuct 
// Update Seller Product
export const updateSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, sku, color, size, brand, price, description, 
      catItems, subcat, seller_email, bank, account_number, 
      stock, unit_of_measurement, status, existingImages 
    } = req.body;

    console.log("Update request received for product ID:", id);
    console.log("Request body:", req.body);
    console.log("Files received:", req.files);
    
    const product = await SellerProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Handle existing images
    let images = [];
    if (existingImages) {
      try {
        // Parse the JSON string of existing images
        images = JSON.parse(existingImages);
        console.log("Parsed existing images:", images);
      } catch (e) {
        console.error('Error parsing existingImages:', e);
        return res.status(400).json({ message: 'Invalid existingImages format' });
      }
    }

    // Process new images if any
    if (req.files && req.files.length > 0) {
      console.log("Processing new images:", req.files.length);
      for (const file of req.files) {
        const optimizedPath = path.join(__dirname, '../uploads', `${Date.now()}-${file.originalname}.webp`);

        await sharp(file.buffer)
          .resize(800)
          .webp({ quality: 80 })
          .toFile(optimizedPath);

        const imagePath = `/uploads/${path.basename(optimizedPath)}`;
        images.push(imagePath);
        console.log("Added new image:", imagePath);
      }
    }

    console.log("Final image array for update:", images);

    // Update product fields
    await product.update({
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
      bank,
      stock,
      status,
      unit_of_measurement,
      account_number,
      image: images, // Use the combined images array
    });

    res.status(200).json({ 
      message: 'Seller product updated successfully!', 
      product: {
        ...product.toJSON(),
        image: images // Ensure the response includes the updated images
      }
    });
  } catch (error) {
    console.error('Error updating seller product:', error);
    res.status(500).json({ message: 'Failed to update seller product.', error: error.message });
  }
};

// Approve Seller Product
export const approveSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await SellerProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.status === 'approved') {
      return res.status(400).json({ message: 'Product is already approved.' });
    }

    product.status = 'approved';
    await product.save();

    res.status(200).json({ message: 'Product approved successfully!', product });
  } catch (error) {
    console.error('Error approving seller product:', error);
    res.status(500).json({ message: 'Failed to approve seller product', error });
  }
};
// decline products 
export const getApprovedSellerProductById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const product = await SellerProduct.findOne({
      where: { id, status: 'approved' }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or not approved.' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching Approved seller product by ID:', error);
    res.status(500).json({ message: 'Failed to fetch Approved seller product.' });
  }
};

// update the  seller product status    
 export const updateSellerProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'decline'

    if (!['approve', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "decline".' });
    }

    const product = await SellerProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (action === 'approve' && product.status === 'approved') {
      return res.status(400).json({ message: 'Product is already approved.' });
    }

    if (action === 'decline' && product.status === 'declined') {
      return res.status(400).json({ message: 'Product is already declined.' });
    }

    // Update the status based on the action
    product.status = action === 'approve' ? 'approved' : 'declined';
    await product.save();

    res.status(200).json({ 
      message: `Product ${action}d successfully!`, 
      product 
    });
  } catch (error) {
    console.error(`Error ${action}ing seller product:`, error);
    res.status(500).json({ message: `Failed to ${action} seller product.`, error });
  }
};
 // Get All Seller Products
export const getAllSellerProducts = async (req, res) => {
  try {
    const products = await SellerProduct.findAll();

    if (products.length === 0) {
      return res.status(404).json({ message: 'No seller products found.' });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching all seller products:', error);
    res.status(500).json({ message: 'Failed to fetch seller products.' });
  }
};

       
// Get Seller Products by Email
export const getSellerProducts = async (req, res) => {
  try {
    const { seller_email } = req.params;
    const products = await SellerProduct.findAll({ where: { seller_email } });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found for this seller.' });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ message: 'Failed to fetch seller products.' });
  }
};

// Get All Pending Seller Products
export const getPendingSellerProducts = async (req, res) => {
  try {
    const products = await SellerProduct.findAll({ where: { status: 'pending' } });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching pending seller products:', error);
    res.status(500).json({ message: 'Failed to fetch pending seller products.' });
  }
};
// get all approved approved products
export const getApprovedSellerProducts = async (req, res) => {
  try {
    const products = await SellerProduct.findAll({ where: { status: 'approved' } });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching Approved seller products:', error);
    res.status(500).json({ message: 'Failed to fetch Appeoved seller products.' });
  }
};
// Get All approved seller Products


// Delete Seller Product
export const deleteSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await SellerProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    for (const imagePath of product.image) {
      const filePath = path.join(__dirname, '..', imagePath);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting file:', filePath, err);
      }
    }

    await product.destroy();
    res.status(200).json({ message: 'Seller product deleted successfully!' });
  } catch (error) {
    console.error('Error deleting seller product:', error);
    res.status(500).json({ message: 'Failed to delete seller product.' });
  }
};

