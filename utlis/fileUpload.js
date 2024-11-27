import multer from 'multer';
import path from 'path';

// Set up multer storage for screenshots
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/screenshots'); // Screenshot folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Filename with timestamp
  },
});

// Set up multer storage for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/products'); // Product images folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Filename with timestamp
  },
});

// Multer upload configuration for screenshots (single file upload)
const uploadScreenshot = multer({
  storage: screenshotStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      return cb(new Error('Only images (JPG, JPEG, PNG) are allowed for screenshots!'), false);
    }
    cb(null, true);
  },
}).single('screenshot'); // 'screenshot' is the field name for the screenshot

// Multer upload configuration for product images (multiple files upload)
const uploadProductImages = multer({
  storage: productStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      return cb(new Error('Only images (JPG, JPEG, PNG) are allowed for product images!'), false);
    }
    cb(null, true);
  },
}).array('productImages', 5); // 'productImages' is the field name for the product images, max 5 images

// Function to handle uploading screenshot
export const uploadScreenshotHandler = async (file) => {
  const filePath = `/uploads/screenshots/${file.filename}`; // Path for screenshot
  return filePath;
};

// Function to handle uploading product images
export const uploadProductImagesHandler = async (files) => {
  const filePaths = files.map(file => `/uploads/products/${file.filename}`); // Paths for product images
  return filePaths;
};

export { uploadScreenshot, uploadProductImages };
