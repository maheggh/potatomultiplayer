// controllers/inventoryController.js
const User = require('../models/User');

/**
 * Get user's inventory
 */
exports.getInventory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return the embedded inventory (new format)
    res.status(200).json({
      success: true,
      inventory: user.inventory || [],
      money: user.money
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching inventory' });
  }
};

/**
 * Update inventory (for when items change properties)
 */
exports.updateInventory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { inventory } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!Array.isArray(inventory)) {
      return res.status(400).json({ success: false, message: 'Inventory must be an array.' });
    }

    user.inventory = inventory;
    await user.save();

    res.status(200).json({ 
      success: true, 
      inventory: user.inventory 
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ success: false, message: 'Server error updating inventory' });
  }
};

/**
 * Add an item to user's inventory
 */
exports.addItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { item } = req.body;

    if (!item || !item.name) {
      return res.status(400).json({ success: false, message: 'Invalid item data' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find if item already exists in inventory
    const existingItemIndex = user.inventory.findIndex(i => i.name === item.name);
    
    if (existingItemIndex !== -1) {
      // Increase quantity if item exists
      user.inventory[existingItemIndex].quantity += item.quantity || 1;
    } else {
      // Add new item to inventory
      user.inventory.push({
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price || 0,
        attributes: item.attributes || {},
        image: item.image || ''
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      inventory: user.inventory
    });
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    res.status(500).json({ success: false, message: 'Server error adding item' });
  }
};

/**
 * Remove an item from user's inventory
 */
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemName, quantity = 1 } = req.body;

    if (!itemName) {
      return res.status(400).json({ success: false, message: 'Item name is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the item in inventory
    const itemIndex = user.inventory.findIndex(i => i.name === itemName);
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in inventory' });
    }

    // Decrease quantity
    user.inventory[itemIndex].quantity -= quantity;

    // Remove item if quantity reaches 0 or below
    if (user.inventory[itemIndex].quantity <= 0) {
      user.inventory.splice(itemIndex, 1);
    }

    await user.save();

    res.status(200).json({
      success: true,
      inventory: user.inventory
    });
  } catch (error) {
    console.error('Error removing item from inventory:', error);
    res.status(500).json({ success: false, message: 'Server error removing item' });
  }
};

/**
 * Collect loot and add to inventory
 */
exports.collectLoot = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { lootItem } = req.body;

    if (!lootItem || !lootItem.name) {
      return res.status(400).json({ success: false, message: 'Invalid loot item data' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find if item already exists in inventory
    const existingItemIndex = user.inventory.findIndex(i => i.name === lootItem.name);
    
    if (existingItemIndex !== -1) {
      // Increase quantity if item exists
      user.inventory[existingItemIndex].quantity += lootItem.quantity || 1;
    } else {
      // Add new item to inventory
      user.inventory.push({
        name: lootItem.name,
        quantity: lootItem.quantity || 1,
        price: lootItem.price || 0,
        attributes: lootItem.attributes || {},
        image: lootItem.image || ''
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      inventory: user.inventory
    });
  } catch (error) {
    console.error('Error collecting loot:', error);
    res.status(500).json({ success: false, message: 'Server error collecting loot' });
  }
};