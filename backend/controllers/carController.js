// backend/controllers/carController.js
const Car = require('../models/Car');
const { allCars } = require('../data/cars');

/**
 * Get all cars in the inventory
 */
exports.getCarsInventory = async (req, res, next) => {
  try {
    // Check if there are cars in the database
    let cars = await Car.find();
    
    // If no cars found in DB, return the predefined cars
    if (!cars || cars.length === 0) {
      return res.json({ 
        success: true, 
        cars: allCars,
        source: 'predefined'
      });
    }
    
    // Return the cars from database
    return res.json({ 
      success: true, 
      cars,
      source: 'database' 
    });
  } catch (error) {
    console.error('Error fetching cars inventory:', error);
    next(error);
  }
};

/**
 * Get a specific car by ID
 */
exports.getCarById = async (req, res, next) => {
  try {
    const carId = req.params.id;
    
    // Validate ID format
    if (!carId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid car ID format' 
      });
    }
    
    const car = await Car.findById(carId);
    
    if (!car) {
      return res.status(404).json({ 
        success: false, 
        message: 'Car not found' 
      });
    }
    
    return res.json({ success: true, car });
  } catch (error) {
    console.error('Error fetching car by ID:', error);
    next(error);
  }
};

/**
 * Create a new car
 */
exports.createCar = async (req, res, next) => {
  try {
    const { name, price, image, type } = req.body;
    
    // Validate required fields
    if (!name || !price || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, price, and type are required' 
      });
    }
    
    const newCar = new Car({
      name,
      price,
      image: image || '/assets/default-car.png',
      type
    });
    
    await newCar.save();
    
    return res.status(201).json({ 
      success: true, 
      message: 'Car created successfully', 
      car: newCar 
    });
  } catch (error) {
    console.error('Error creating car:', error);
    next(error);
  }
};

/**
 * Update an existing car
 */
exports.updateCar = async (req, res, next) => {
  try {
    const carId = req.params.id;
    const { name, price, image, type } = req.body;
    
    // Validate ID format
    if (!carId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid car ID format' 
      });
    }
    
    // Check if at least one field is provided for update
    if (!name && !price && !image && !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one field must be provided for update' 
      });
    }
    
    // Build update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (image) updateData.image = image;
    if (type) updateData.type = type;
    
    const updatedCar = await Car.findByIdAndUpdate(
      carId,
      updateData,
      { new: true } // Return the updated document
    );
    
    if (!updatedCar) {
      return res.status(404).json({ 
        success: false, 
        message: 'Car not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'Car updated successfully', 
      car: updatedCar 
    });
  } catch (error) {
    console.error('Error updating car:', error);
    next(error);
  }
};

/**
 * Delete a car
 */
exports.deleteCar = async (req, res, next) => {
  try {
    const carId = req.params.id;
    
    // Validate ID format
    if (!carId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid car ID format' 
      });
    }
    
    const deletedCar = await Car.findByIdAndDelete(carId);
    
    if (!deletedCar) {
      return res.status(404).json({ 
        success: false, 
        message: 'Car not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'Car deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    next(error);
  }
};

/**
 * Seed the database with predefined cars
 */
exports.seedCars = async (req, res, next) => {
  try {
    // Check if cars already exist
    const existingCars = await Car.find();
    
    if (existingCars.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cars already exist in the database' 
      });
    }
    
    // Insert all predefined cars
    await Car.insertMany(allCars);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Database seeded with cars successfully', 
      count: allCars.length 
    });
  } catch (error) {
    console.error('Error seeding cars:', error);
    next(error);
  }
};