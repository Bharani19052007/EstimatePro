const express = require("express");
const router = express.Router();
const Estimation = require("../models/Estimation");
const Project = require("../models/Project");
const auth = require("../middleware/auth");

// Middleware to verify JWT token
router.use(auth);

// Get all estimations for a user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const estimations = await Estimation.find({ userId })
      .populate('projectId', 'projectName status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: estimations
    });
  } catch (error) {
    console.error("Error fetching estimations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch estimations"
    });
  }
});

// Create new estimation
router.post("/", async (req, res) => {
  try {
    const {
      projectName,
      client,
      description,
      costBreakdown,
      resources,
      timeline,
      contingency,
      totalCost,
      finalCost,
      status,
      duration,
      teamSize,
      riskLevel
    } = req.body;

    console.log("Received estimation creation request:", JSON.stringify(req.body, null, 2));

    if (!projectName) {
      return res.status(400).json({
        success: false,
        error: "Project name is required"
      });
    }

    // Find or create project
    let project;
    project = await Project.findOne({ 
      userId: req.user.id, 
      projectName: projectName 
    });
      
    if (!project) {
      // Create new project only if it doesn't exist
      const startDate = new Date();
      const estimatedDuration = parseInt(duration) || 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (estimatedDuration * 7)); // Convert weeks to days
      
      project = new Project({
        userId: req.user.id,
        projectName: projectName,
        description: description || '',
        startDate: startDate,
        endDate: endDate,
        estimatedBudget: totalCost || 0,
        status: 'planning',
        priority: 'medium',
        client: client ? {
          name: client,
          email: '',
          phone: '',
          company: client
        } : {
          name: '',
          email: '',
          phone: '',
          company: ''
        }
      });
      
      project = await project.save();
      console.log("Created new project:", project._id);
    }

    // Transform frontend costBreakdown to backend format
    const transformedCostBreakdown = [];
    if (costBreakdown && Array.isArray(costBreakdown)) {
      costBreakdown.forEach(category => {
        if (category.items && Array.isArray(category.items)) {
          category.items.forEach(item => {
            transformedCostBreakdown.push({
              category: category.category || 'Uncategorized',
              estimatedCost: item.total || 0,
              actualCost: 0,
              description: item.name || ''
            });
          });
        }
      });
    }

    // Transform resources to ensure required fields
    const transformedResources = [];
    if (resources && Array.isArray(resources)) {
      resources.forEach(resource => {
        transformedResources.push({
          name: resource.name || 'Unknown Resource',
          type: resource.type || 'other',
          quantity: resource.quantity || 1,
          unitCost: resource.unitCost || 0,
          totalCost: resource.totalCost || (resource.unitCost || 0) * (resource.quantity || 1)
        });
      });
    }

    // Create estimation
    const newEstimation = new Estimation({
      projectId: project._id,
      userId: req.user.id,
      projectName: projectName,
      costBreakdown: transformedCostBreakdown,
      resources: transformedResources,
      timeline: timeline || { phases: [] },
      contingency: contingency || 10,
      totalCost: totalCost || 0,
      finalCost: finalCost || 0,
      status: status || 'draft',
      duration: duration || 1,
      teamSize: teamSize || 1,
      riskLevel: riskLevel || 'medium',
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedEstimation = await newEstimation.save();
    console.log("Created estimation:", savedEstimation._id);

    res.status(201).json({
      success: true,
      data: savedEstimation,
      message: "Estimation created successfully"
    });
  } catch (error) {
    console.error("Error creating estimation:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create estimation"
    });
  }
});

module.exports = router;
