// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Route Imports
const userRoutes = require('./routes/userRoutes');
const carRoutes = require('./routes/carRoutes');
const carRacesRoutes = require('./routes/carRacesRoutes');
const carTheftRoutes = require('./routes/carTheftRoutes');
const theftRoutes = require('./routes/theftRoutes');
const itemRoutes = require('./routes/itemRoutes');
const weaponRoutes = require('./routes/weaponRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const assassinationRoutes = require('./routes/assassinationRoutes');
const gamblingRoutes = require('./routes/gamblingRoutes');
const playerRoutes = require('./routes/playerRoutes'); // Keep the import
const jailRoutes = require('./routes/jailRoutes');
const authMiddleware = require('./middleware/authMiddleware'); // Keep the import, used below

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());

// Rate Limiting
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 registration requests per windowMs
  message: { success: false, message: 'Too many accounts created from this IP, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/users/register', registrationLimiter);

// API Routes - Apply auth middleware where needed
app.use('/api/users', userRoutes);
app.use('/api/weapons', weaponRoutes); // Corrected: No auth middleware here

// --- CORRECTED LINE for /api/players ---
// Remove authMiddleware here; apply it within playerRoutes if specific endpoints need it
app.use('/api/players', playerRoutes);
// --- END CORRECTION ---

// Apply authMiddleware selectively to other routes that need protection for ALL their endpoints
app.use('/api/cars', authMiddleware, carRoutes);
app.use('/api/carraces', authMiddleware, carRacesRoutes);
app.use('/api/cartheft', authMiddleware, carTheftRoutes);
app.use('/api/theft', authMiddleware, theftRoutes);
app.use('/api/items', authMiddleware, itemRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/assassination', authMiddleware, assassinationRoutes);
app.use('/api/spin', authMiddleware, gamblingRoutes);
app.use('/api/jail', authMiddleware, jailRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Serve Frontend Static Files
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Catch-all for Frontend Routing
app.get('*', (req, res) => {
   if (req.accepts('html')) {
        res.sendFile(path.resolve(frontendDistPath, 'index.html'), (err) => {
            if (err && !res.headersSent) {
                console.error("Error sending index.html:", err);
                res.status(500).send('Error serving frontend application.');
            }
        });
    } else {
        res.status(404).send('Not Found');
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
     success: false,
     message: err.message || 'Internal server error'
  });
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});