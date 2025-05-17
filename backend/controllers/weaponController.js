const User = require('../models/User');

// Rebalanced weapon data with exponential pricing (4x cost for each 2x accuracy)
// Top weapon at 500k as requested
const weapons = [
  // Pistols - Low accuracy, low price
  { 
    id: 'w1', 
    name: 'Potato Peeler Pistol', 
    price: 1000, 
    accuracy: 20, 
    category: 'pistol',
    image: 'potato-peeler-pistol.png'
  },
  { 
    id: 'w2', 
    name: 'Hashbrown Handgun', 
    price: 4000, 
    accuracy: 30, 
    category: 'pistol',
    image: 'hashbrown-handgun.png'
  },
  
  // Rifles - Medium accuracy, medium price
  { 
    id: 'w3', 
    name: 'Masher Machinegun', 
    price: 16000, 
    accuracy: 40, 
    category: 'rifle',
    image: 'masher-machinegun.png'
  },
  { 
    id: 'w4', 
    name: 'Fryer Firearm', 
    price: 32000, 
    accuracy: 50, 
    category: 'rifle',
    image: 'fryer-firearm.png'
  },
  
  // Shotguns - Unique balance (higher damage but lower accuracy)
  { 
    id: 'w5', 
    name: 'Gnocchi Grenade', 
    price: 8000, 
    accuracy: 35, 
    category: 'shotgun',
    image: 'gnocchi-granade.png'
  },
  { 
    id: 'w6', 
    name: 'Latke Launcher', 
    price: 24000, 
    accuracy: 45, 
    category: 'shotgun',
    image: 'latke-launcher.png'
  },
  
  // Sniper Rifles - High accuracy, high price
  { 
    id: 'w7', 
    name: 'Spud Gun', 
    price: 64000, 
    accuracy: 60, 
    category: 'sniper',
    image: 'spud-gun.png'
  },
  { 
    id: 'w8', 
    name: 'Potato Bazooka', 
    price: 125000, 
    accuracy: 70, 
    category: 'sniper',
    image: 'potato-bazooka.png'
  },
  
  // Special weapons - Very high accuracy, premium price
  { 
    id: 'w9', 
    name: 'Chips Cannon', 
    price: 500000, 
    accuracy: 80, 
    category: 'special',
    image: 'chips-cannon.png'
  },
];

// Get all weapons
exports.getAllWeapons = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      items: weapons
    });
  } catch (error) {
    console.error('Error fetching weapons:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching weapons'
    });
  }
};

// Buy a weapon
exports.buyWeapon = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { weaponId } = req.body;

    // Find the weapon
    const weapon = weapons.find(w => w.id === weaponId);
    if (!weapon) {
      return res.status(404).json({
        success: false,
        message: 'Weapon not found'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already owns this weapon
    const alreadyOwns = user.inventory.some(item => item.name === weapon.name);
    if (alreadyOwns) {
      return res.status(400).json({
        success: false,
        message: 'You already own this weapon'
      });
    }

    // Check if user has enough money
    if (user.money < weapon.price) {
      return res.status(400).json({
        success: false,
        message: `Not enough money to buy ${weapon.name}. Need $${weapon.price.toLocaleString()}, have $${user.money.toLocaleString()}`
      });
    }

    // Add weapon to inventory
    user.inventory.push({
      name: weapon.name,
      price: weapon.price,
      image: weapon.image,
      attributes: {
        accuracy: weapon.accuracy,
        category: weapon.category
      }
    });

    // Deduct money
    user.money -= weapon.price;

    // Save user
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Successfully purchased ${weapon.name}`,
      money: user.money,
      inventory: user.inventory
    });
  } catch (error) {
    console.error('Error buying weapon:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during purchase'
    });
  }
};

// Sell a weapon
exports.sellWeapon = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { weaponName } = req.body;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the weapon in inventory
    const weaponIndex = user.inventory.findIndex(item => item.name === weaponName);
    if (weaponIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Weapon not found in inventory'
      });
    }

    // Calculate sell price (50% of purchase price)
    const weapon = user.inventory[weaponIndex];
    const sellPrice = Math.floor(weapon.price * 0.5);

    // Remove weapon from inventory
    user.inventory.splice(weaponIndex, 1);

    // Add money
    user.money += sellPrice;

    // Save user
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Successfully sold ${weaponName} for $${sellPrice.toLocaleString()}`,
      money: user.money,
      inventory: user.inventory
    });
  } catch (error) {
    console.error('Error selling weapon:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during sale'
    });
  }
};

// Get weapon details
exports.getWeaponDetails = async (req, res) => {
  try {
    const { weaponId } = req.params;

    const weapon = weapons.find(w => w.id === weaponId);
    if (!weapon) {
      return res.status(404).json({
        success: false,
        message: 'Weapon not found'
      });
    }

    return res.status(200).json({
      success: true,
      weapon
    });
  } catch (error) {
    console.error('Error fetching weapon details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching weapon details'
    });
  }
};