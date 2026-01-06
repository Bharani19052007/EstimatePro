const express = require("express");
const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const router = express.Router();

// Add activity
router.post("/", async (req, res) => {
  try {
    console.log("Received activity creation request:", req.body);
    
    const { taskId, activityName, estimatedCost, actualCost, estimatedHours, actualHours, status, assignedTo, date, description } = req.body;
    
    if (!taskId || !activityName) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields. Please provide taskId and activityName." 
      });
    }

    const activityData = {
      taskId: taskId,
      activityName: activityName,
      description: description || "",
      estimatedCost: estimatedCost || 0,
      actualCost: actualCost || 0,
      estimatedHours: estimatedHours || 0,
      actualHours: actualHours || 0,
      status: status || 'pending',
      assignedTo: assignedTo || null,
      date: date ? new Date(date) : new Date()
    };

    console.log("Attempting to save activity:", activityData);
    const savedActivity = await Activity.create(activityData);
    
    console.log("Activity saved successfully:", savedActivity);
    res.status(201).json({
      success: true,
      data: savedActivity
    });
    
  } catch (err) {
    console.error("Error creating activity:", err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false,
        error: messages.join('. ') 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      success: false,
      error: "Server error while creating activity",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get activities by task ID
router.get("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const activities = await Activity.find({ taskId })
      .sort({ date: 1 });
      
    res.json({
      success: true,
      data: activities
    });
    
  } catch (err) {
    console.error("Error fetching activities by task:", err);
    res.status(500).json({ 
      success: false,
      error: "Error fetching activities",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Delete activity
router.delete("/:activityId", async (req, res) => {
  try {
    const { activityId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid activity ID" 
      });
    }
    
    const deletedActivity = await Activity.findByIdAndDelete(activityId);
    
    if (!deletedActivity) {
      return res.status(404).json({ 
        success: false,
        error: "Activity not found" 
      });
    }
    
    console.log("Activity deleted successfully:", deletedActivity);
    res.json({
      success: true,
      message: "Activity deleted successfully",
      data: deletedActivity
    });
    
  } catch (err) {
    console.error("Error deleting activity:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while deleting activity",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
