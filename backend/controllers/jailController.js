// controllers/jailController.js
const User = require('../models/User');

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

exports.startJailSentence = async (user, jailDurationInSeconds) => {
    if (!user || typeof jailDurationInSeconds !== 'number' || jailDurationInSeconds <= 0) {
        console.error('Invalid arguments provided to startJailSentence for user:', user?._id);
        throw new Error('Invalid arguments for starting jail sentence.'); // Throw error to be caught by calling controller
    }
    try {
        user.inJail = true;
        const jailTimeEnd = Date.now() + jailDurationInSeconds * 1000;
        user.jailTimeEnd = new Date(jailTimeEnd);
        await user.save();
        console.log(`User ${user.username} sent to jail for ${jailDurationInSeconds} seconds. Release at: ${user.jailTimeEnd}`);
    } catch (error) {
        console.error(`Failed to start jail sentence for user ${user.username}:`, error);
        throw error; // Re-throw the error to be handled by the calling controller
    }
};