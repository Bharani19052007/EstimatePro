const express = require("express");
const router = express.Router();
const Estimation = require("../models/Estimation");
const Project = require("../models/Project");
const auth = require("../middleware/auth");

// Middleware to verify JWT token
router.use(auth);

// Get dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all estimations for the user
    const estimations = await Estimation.find({ userId });
    
    // Get all projects for the user
    const projects = await Project.find({ userId });
    
    // Calculate statistics
    const stats = {
      totalProjects: projects.length,
      totalEstimations: estimations.length,
      totalValue: estimations.reduce((sum, e) => sum + (e.finalCost || 0), 0),
      activeProjects: projects.filter(p => p.status === 'planning' || p.status === 'in_progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      activeEstimations: estimations.filter(e => e.status === 'draft' || e.status === 'in_progress').length,
      completedEstimations: estimations.filter(e => e.status === 'completed').length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics"
    });
  }
});

module.exports = router;
