const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const auth = require("../middleware/auth");
const router = express.Router();

// Middleware to verify JWT token
router.use(auth);

// Add task
router.post("/", async (req, res) => {
  try {
    console.log("Received task creation request:", req.body);
    
    const { projectId, taskName, description, status, priority, estimatedHours, actualHours, assignedTo, startDate, dueDate, dependencies, tags, estimatedCost, actualCost } = req.body;
    
    if (!projectId || !taskName) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields. Please provide projectId and taskName." 
      });
    }

    const taskData = {
      projectId: projectId,
      taskName: taskName,
      description: description || "",
      status: status || 'todo',
      priority: priority || 'medium',
      estimatedHours: estimatedHours || 0,
      actualHours: actualHours || 0,
      assignedTo: assignedTo || null,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      dependencies: dependencies || [],
      tags: tags || [],
      estimatedCost: estimatedCost || 0,
      actualCost: actualCost || 0
    };

    console.log("Attempting to save task:", taskData);
    const savedTask = await Task.create(taskData);
    
    console.log("Task saved successfully:", savedTask);
    res.status(201).json({
      success: true,
      data: savedTask
    });
    
  } catch (err) {
    console.error("Error creating task:", err);
    
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
      error: "Server error while creating task",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get tasks by project ID
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const tasks = await Task.find({ projectId })
      .sort({ dueDate: 1 });
      
    res.json({
      success: true,
      data: tasks
    });
    
  } catch (err) {
    console.error("Error fetching tasks by project:", err);
    res.status(500).json({ 
      success: false,
      error: "Error fetching tasks",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update task
router.put("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid task ID" 
      });
    }
    
    console.log("Updating task:", taskId, "with data:", updateData);
    
    const updatedTask = await Task.findByIdAndUpdate(
      taskId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({ 
        success: false,
        error: "Task not found" 
      });
    }
    
    console.log("Task updated successfully:", updatedTask);
    res.json({
      success: true,
      data: updatedTask
    });
    
  } catch (err) {
    console.error("Error updating task:", err);
    
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
      error: "Server error while updating task",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Delete task
router.delete("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid task ID" 
      });
    }
    
    const deletedTask = await Task.findByIdAndDelete(taskId);
    
    if (!deletedTask) {
      return res.status(404).json({ 
        success: false,
        error: "Task not found" 
      });
    }
    
    // Also delete all activities associated with this task
    const Activity = require("../models/Activity");
    await Activity.deleteMany({ taskId: taskId });
    
    console.log("Task and associated activities deleted successfully:", deletedTask);
    res.json({
      success: true,
      message: "Task and associated activities deleted successfully",
      data: deletedTask
    });
    
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while deleting task",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
