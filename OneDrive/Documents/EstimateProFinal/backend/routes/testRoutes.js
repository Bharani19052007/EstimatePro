const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Estimation = require("../models/Estimation");
const User = require("../models/User");

// Test endpoint to get data without authentication
router.get("/dashboard-test", async (req, res) => {
  try {
    console.log('🧪 Test endpoint called');
    
    // Find your user
    const yourUser = await User.findOne({ email: 'name@gmail.com' });
    
    if (!yourUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    console.log(`🧪 Found user: ${yourUser.name} (ID: ${yourUser._id})`);
    
    // Get projects and estimations
    const projects = await Project.find({ userId: yourUser._id });
    const estimations = await Estimation.find({ userId: yourUser._id });
    
    // Calculate stats
    const stats = {
      totalProjects: projects.length,
      totalEstimations: estimations.length,
      totalValue: estimations.reduce((sum, e) => sum + (e.finalCost || 0), 0),
      activeProjects: projects.filter(p => p.status === 'planning' || p.status === 'in_progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length
    };
    
    console.log(`🧪 Test results: ${stats.totalProjects} projects, ${stats.totalEstimations} estimations`);
    
    res.json({
      success: true,
      data: {
        projects,
        estimations,
        stats
      }
    });
    
  } catch (error) {
    console.error('🧪 Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
