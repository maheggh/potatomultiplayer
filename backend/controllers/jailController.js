// backend/controllers/jailController.js
const User = require('../models/User');

exports.getJailStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if currently in jail
    if (!user.inJail || !user.jailTimeEnd) {
      // Ensure flags are clear if not in jail
      if (user.inJail) { // Corrective: If somehow inJail is true but no timeEnd
        user.inJail = false;
        user.jailTimeEnd = null;
        user.breakoutAttempted = false;
        await user.save();
      }
      return res.status(200).json({ success: true, inJail: false });
    }

    const now = Date.now();
    const jailEndTime = new Date(user.jailTimeEnd).getTime();

    // Check if sentence is over
    if (now >= jailEndTime) {
      user.inJail = false;
      user.jailTimeEnd = null;
      user.breakoutAttempted = false; // Reset flag on release
      await user.save();
      console.log(`User ${user.username} released from jail.`);
      return res.status(200).json({ success: true, inJail: false, released: true });
    } else {
      // Still in jail
      return res.status(200).json({
        success: true,
        inJail: true,
        jailTimeEnd: user.jailTimeEnd,
        breakoutAttempted: user.breakoutAttempted, // <-- Return the flag status
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
        return null;
    }
    try {
        user.inJail = true;
        const jailTimeEndMillis = Date.now() + jailDurationInSeconds * 1000;
        user.jailTimeEnd = new Date(jailTimeEndMillis);
        user.breakoutAttempted = false; // <-- Reset breakout attempt flag for new sentence
        await user.save();
        console.log(`User ${user.username} sent to jail for ${jailDurationInSeconds} seconds. Release at: ${user.jailTimeEnd}`);
        return user.jailTimeEnd;
    } catch (error) {
        console.error(`Failed to save user state for jail sentence for user ${user?.username}:`, error);
        return null;
    }
};

// --- NEW Breakout Function ---
exports.attemptBreakout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Validate conditions for breakout attempt
        if (!user.inJail || !user.jailTimeEnd) {
            return res.status(400).json({ success: false, message: 'You are not currently in jail.' });
        }
        if (user.breakoutAttempted) {
            return res.status(400).json({ success: false, message: 'You have already attempted to break out during this sentence.' });
        }
        // Check if time is already up (shouldn't happen if called from UI, but good check)
        if (Date.now() >= new Date(user.jailTimeEnd).getTime()) {
             return res.status(400).json({ success: false, message: 'Your jail time is already up.' });
        }


        // Mark attempt as made
        user.breakoutAttempted = true;

        // 50% chance
        const breakoutSuccess = Math.random() < 0.5;

        if (breakoutSuccess) {
            console.log(`User ${user.username} successfully broke out of jail!`);
            user.inJail = false;
            user.jailTimeEnd = null;
            // breakoutAttempted remains true until next sentence
            await user.save();
            return res.status(200).json({
                success: true,
                breakoutSuccessful: true,
                message: "Breakout successful! You're free!",
                inJail: false // Send back updated status
            });
        } else {
            console.log(`User ${user.username} failed to break out of jail.`);
            // Only need to save the breakoutAttempted flag change
            await user.save();
            return res.status(200).json({
                success: true,
                breakoutSuccessful: false,
                message: "Breakout attempt failed! Serve your time.",
                breakoutAttempted: true // Send back updated status
            });
        }

    } catch (error) {
        console.error('Error attempting breakout:', error.message);
        // Avoid saving if error occurred before potentially critical changes
        return res.status(500).json({
            success: false,
            message: 'Server error during breakout attempt',
            error: error.message,
        });
    }
};