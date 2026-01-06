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

// Get estimation by ID
router.get("/:id", async (req, res) => {
  try {
    console.log("GET estimation by ID:", req.params.id);
    console.log("User ID:", req.user.id);
    
    const estimation = await Estimation.findById(req.params.id)
      .populate('projectId', 'projectName status')
      .populate('userId', 'name email')
      .populate('createdBy', 'name email');
    
    if (!estimation) {
      console.log("Estimation not found:", req.params.id);
      return res.status(404).json({
        success: false,
        error: "Estimation not found"
      });
    }

    // Check if user owns this estimation
    if (estimation.userId._id.toString() !== req.user.id) {
      console.log("Access denied for user:", req.user.id, "estimation owner:", estimation.userId._id);
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    console.log("Estimation found and accessible:", estimation._id);
    res.json({
      success: true,
      data: estimation
    });
  } catch (error) {
    console.error("Error fetching estimation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch estimation"
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
    console.log("TotalCost:", totalCost);
    console.log("FinalCost:", finalCost);
    console.log("CostBreakdown:", costBreakdown);

    // Create projectData object from individual fields
    const projectData = {
      projectName,
      client,
      description,
      estimatedDuration: duration,
      priority: 'medium'
    };

    console.log("Project data:", projectData);
    console.log("User ID:", req.user.id);

    if (!projectName) {
      return res.status(400).json({
        success: false,
        error: "Project name is required"
      });
    }

    // Find or create project
    let project;
    // Check if project with same name already exists for this user
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
    } else {
      console.log("Using existing project:", project._id);
      // Update existing project with new budget if needed
      if (totalCost && totalCost > project.estimatedBudget) {
        project.estimatedBudget = totalCost;
        await project.save();
      }
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
      data: savedEstimation
    });
  } catch (error) {
    console.error("Error creating estimation:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create estimation"
    });
  }
});

// Update estimation
router.put("/:id", async (req, res) => {
  try {
    console.log("PUT estimation update request:", req.params.id);
    console.log("User ID:", req.user.id);
    console.log("Request body:", req.body);
    
    const {
      projectData,
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
    
    const estimation = await Estimation.findById(req.params.id);
    
    if (!estimation) {
      return res.status(404).json({
        success: false,
        error: "Estimation not found"
      });
    }

    // Check if user owns this estimation
    if (estimation.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
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

    // Prepare update data
    const updateData = {
      projectName: projectData?.projectName || estimation.projectName,
      costBreakdown: transformedCostBreakdown,
      resources: transformedResources,
      timeline: timeline || estimation.timeline,
      contingency: contingency || estimation.contingency,
      totalCost: totalCost || estimation.totalCost,
      finalCost: finalCost || estimation.finalCost,
      status: status || estimation.status,
      duration: duration || estimation.duration,
      teamSize: teamSize || estimation.teamSize,
      riskLevel: riskLevel || estimation.riskLevel,
      notes: projectData?.notes || estimation.notes,
      updatedAt: new Date()
    };

    const updatedEstimation = await Estimation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('projectId', 'projectName status')
     .populate('createdBy', 'name email');

    console.log("Estimation updated successfully:", updatedEstimation);

    res.json({
      success: true,
      data: updatedEstimation
    });
  } catch (error) {
    console.error("Error updating estimation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update estimation",
      details: error.message
    });
  }
});

// Delete estimation
router.delete("/:id", async (req, res) => {
  try {
    console.log("Received estimation delete request:", req.params.id);
    
    const estimation = await Estimation.findById(req.params.id);
    
    if (!estimation) {
      return res.status(404).json({
        success: false,
        error: "Estimation not found"
      });
    }

    // Check if user owns this estimation
    if (estimation.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    await Estimation.findByIdAndDelete(req.params.id);

    console.log("Estimation deleted successfully");

    res.json({
      success: true,
      data: { message: "Estimation deleted successfully" }
    });
  } catch (error) {
    console.error("Error deleting estimation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete estimation",
      details: error.message
    });
  }
});

// Get estimation statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const userId = req.user.id;
    const estimations = await Estimation.find({ userId });
    
    const stats = {
      totalEstimations: estimations.length,
      totalValue: estimations.reduce((sum, e) => sum + (e.finalCost || 0), 0),
      draftEstimations: estimations.filter(e => e.status === 'draft').length,
      completedEstimations: estimations.filter(e => e.status === 'completed').length,
      avgEstimationValue: estimations.length > 0 ? 
        estimations.reduce((sum, e) => sum + (e.finalCost || 0), 0) / estimations.length : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error fetching estimation stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch estimation statistics"
    });
  }
});

module.exports = router;
