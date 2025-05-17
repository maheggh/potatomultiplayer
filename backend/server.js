const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

dotenv.config();

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
const playerRoutes = require('./routes/playerRoutes');
const jailRoutes = require('./routes/jailRoutes');
const bossesRoutes = require('./routes/bossesRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many accounts created from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/users/register', registrationLimiter);

app.use('/api/users', userRoutes);
app.use('/api/weapons', weaponRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/items', itemRoutes);

app.use('/api/cars', authMiddleware, carRoutes);
app.use('/api/carraces', authMiddleware, carRacesRoutes);
app.use('/api/cartheft', authMiddleware, carTheftRoutes);
app.use('/api/theft', authMiddleware, theftRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/assassination', authMiddleware, assassinationRoutes);
app.use('/api/gambling', authMiddleware, gamblingRoutes);
app.use('/api/jail', authMiddleware, jailRoutes);
app.use('/api/bosses', authMiddleware, bossesRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

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