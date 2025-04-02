const User = require('../models/User');

// getJailStatus remains the same
exports.getJailStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.inJail || !user.jailTimeEnd) {
      return res.status(200).json({ success: true, inJail: false });
    }

    const now = Date.now();
    const jailEndTime = new Date(user.jailTimeEnd).getTime();

    if (now >= jailEndTime) {
      user.inJail = false;
      user.jailTimeEnd = null;
      await user.save();
      console.log(`User ${user.username} released from jail.`);
      return res.status(200).json({ success: true, inJail: false, released: true });
    } else {
      return res.status(200).json({
        success: true,
        inJail: true,
        jailTimeEnd: user.jailTimeEnd,
      });
    }
  } catch (error) {
    console.error('Error fetching jail status:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching jail status',
      error: error.message,
    });
  }
};

// Updated startJailSentence to return endTime on success, null on failure
exports.startJailSentence = async (user, jailDurationInSeconds) => {
    if (!user || typeof jailDurationInSeconds !== 'number' || jailDurationInSeconds <= 0) {
        console.error('Invalid arguments provided to startJailSentence for user:', user?._id);
        // Don't throw here, return null to indicate failure to the controller
        return null;
    }
    try {
        user.inJail = true;
        const jailTimeEndMillis = Date.now() + jailDurationInSeconds * 1000;
        user.jailTimeEnd = new Date(jailTimeEndMillis);
        await user.save(); // Save the changes
        console.log(`User ${user.username} sent to jail for ${jailDurationInSeconds} seconds. Release at: ${user.jailTimeEnd}`);
        return user.jailTimeEnd; // Return the Date object on success
    } catch (error) {
        console.error(`Failed to save user state for jail sentence for user ${user?.username}:`, error);
        // Return null to indicate failure
        return null;
    }
};