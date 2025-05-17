const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

console.log('Starting server initialization...');

dotenv.config();
console.log('Environment variables loaded');

const app = express();
console.log('Express app created');

// Middleware
app.use(cors());
app.use(express.json());
console.log('Middleware configured');

// Simple test routes
app.get('/api/test', (req, res) => {
  console.log('Test route accessed');
  res.json({ success: true, message: 'Server is running!' });
});

app.get('/api/jail/status', (req, res) => {
  console.log('Jail status route accessed');
  res.json({ success: true, inJail: false });
});

app.get('/api/theft/stolen-items', (req, res) => {
  console.log('Stolen items route accessed');
  res.json({ success: true, items: [] });
});

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
console.log('MONGO_URI present:', !!process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connection successful');
    
    // Start server after DB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:');
    console.error(err);
    
    // Start server even without DB for testing
    console.log('Starting server without MongoDB for testing...');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT} (no DB)`);
      console.log(`URL: http://localhost:${PORT}`);
    });
  });

// Handle common errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:');
  console.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});