const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");

// Get user activities
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const activities = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email');
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activities"
    });
  }
});

// Create activity log (internal use)
router.post("/log", async (req, res) => {
  try {
    const { userId, action, details } = req.body;
    
    const activity = new ActivityLog({
      userId,
      action,
      details,
      timestamp: new Date()
    });
    
    await activity.save();
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({
      success: false,
      error: "Failed to log activity"
    });
  }
});

module.exports = router;
