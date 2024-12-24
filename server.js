import https from 'https';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path'; 
import { fileURLToPath } from 'url';
import { connectDB } from './db/dbConnect.js';
import sequelize from './db/dbConnect.js';
import catitemRoutes from './routes/catItemRoutes.js';
import assignOrderRoutes from './routes/assignOrderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import deliveryBoyRoutes from './routes/deliveryBoyRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import shopperRoutes from './routes/shopperRoutes.js';
import userRoutes from './routes/userRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import CatItem from './models/CatItem.js';
import SubCat from './models/Subcat.js';
import AddProduct from './models/AddProduct.js';
import addProductRoutes from './routes/addProductRoutes.js';
import subcatRoutes from './routes/subCatRoutes.js';
// Import models (for potential associations)
import Category from './models/Category.js';
import Subcategory from './models/Subcategory.js';
import Shop from './models/Shop.js';
import ShopOwner from './models/ShopOwner.js';
import Payment from './models/Payment.js';
import Shopper from './models/Shopper.js';
import DeliveryBoy from './models/DeliveryBoy.js';
import AssignOrder from './models/AssignOrder.js';
// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON
app.use(cors({
  origin: ['http://localhost:3000', 'https://mobile.yeniesuq.com' ,'https://mobadmin.yeniesuq.com'], // Update to match your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));
app.use(morgan('dev')); // Log HTTP requests

// Disable caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Serving static files from:', path.join(__dirname, 'uploads'));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/subcat', subcatRoutes);
app.use('/api/catitem', catitemRoutes);
app.use('/api/receipt', receiptRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/shoppers', shopperRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/deliveryboy', deliveryBoyRoutes );
app.use('/api/category', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/prod', addProductRoutes);
app.use('/api/assign',assignOrderRoutes);


// Handle 404 errors (Route not found)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong!' });
});

// Redirect HTTP to HTTPS (for production)
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Start Server
const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Associate models (if required)
    const models = { Category, Subcategory, Payment, Shop, ShopOwner };
    Object.keys(models).forEach((modelName) => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });
    

    // Sync database models
    await sequelize.sync({ alter: false });
    console.log('Database synchronized successfully.');

    // Load SSL certificate and key
    const sslOptions = {
      key: fs.readFileSync('/etc/letsencrypt/live/backend.yeniesuq.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/backend.yeniesuq.com/fullchain.pem'),
    };

    // Start HTTPS server
    const PORT = process.env.PORT || 443;
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`Server is running securely on https://backend.yeniesuq.com`);
    });

  } catch (error) {
    console.error('Error connecting to the database or starting the server:', error);
    process.exit(1); // Exit on critical failure
  }
};

// Uncaught Exception and Rejection Handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

Shopper.hasMany(AssignOrder, { foreignKey: 'shopper_id', as: 'assignOrders' }); // Alias: assignOrders
AssignOrder.belongsTo(Shopper, { foreignKey: 'shopper_id', as: 'shopper' }); // Alias: shopper

DeliveryBoy.hasMany(AssignOrder, { foreignKey: 'delivery_boy_id', as: 'assignOrders' }); // Alias: assignOrders
AssignOrder.belongsTo(DeliveryBoy, {
  foreignKey: 'delivery_id', // Use 'delivery_id' instead of 'delivery_boy_id'
  as: 'deliveryBoy',
});


// Start the server
startServer();

