require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route imports
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');

// Error middleware import
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Connect Database
connectDB();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'VyaparSetu backend is running' });
});

// Register API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);

// Catch 404 for undefined routes
if (typeof errorMiddleware.notFound === 'function') {
  app.use(errorMiddleware.notFound);
}

// Register Global Error Handler
if (typeof errorMiddleware === 'function') {
  app.use(errorMiddleware);
} else if (errorMiddleware && typeof errorMiddleware.errorHandler === 'function') {
  app.use(errorMiddleware.errorHandler);
}

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server };
