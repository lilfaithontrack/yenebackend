import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './db/dbconnect.js';
import adminRoutes from './routes/adminRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import sequelize from './db/dbConnect.js';
import paymentRoutes from './routes/paymentRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import Category from './models/Category.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import Subcategory from './models/Subcategory.js';
import Payment from './models/Payment.js';  // Import Payment model for storing payment data if applicable
import { processPaymentGateway } from './services/paymentService.js';  // Import payment service for Chapa

dotenv.config();

const app = express();

// Middleware to handle incoming JSON requests
app.use(express.json());

// CORS setup to allow requests from frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

// Cache-Control headers to disable caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Logging HTTP requests
app.use(morgan('dev'));

// Define API routes
app.use('/api/admin', adminRoutes);
app.use ('/api/reciept',adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/payment', paymentRoutes);  // Updated order routes

// 404 Fallback Route
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong!' });
});

const startServer = async () => {
  try {
    // Initialize DB connection
    await connectDB();

    // Ensure that the models are associated properly if needed
    const models = { Category, Subcategory, Payment };  // Added Payment model
    Object.keys(models).forEach((modelName) => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });

    // Sync database models with possible alterations
    await sequelize.sync({ alter: true });
    console.log("Database synchronized with models.");

    // Start the server on the specified port
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to the database or starting the server:", error);
    process.exit(1);  // Exit the process if there's an error starting the server
  }
};

startServer();
