const User = require('../models/User');

exports.addCarToGarage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { car } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cars.push(car);
    await user.save();

    res.status(200).json({ message: 'Car added', cars: user.cars });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add car' });
  }
};

exports.removeCarFromGarage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { carName } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cars = user.cars.filter(car => car.name !== carName);
    await user.save();

    res.status(200).json({ message: 'Car removed', cars: user.cars });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to remove car' });
  }
};
