const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");
const auth = require("../middleware/auth");

// Middleware to verify JWT token
router.use(auth);

// Create default resources for new users
router.post("/seed", async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user already has resources
    const existingResources = await Resource.find({ userId });
    if (existingResources.length > 0) {
      return res.json({
        success: true,
        message: "Resources already exist",
        data: existingResources
      });
    }
    
    // Create default resources
    const defaultResources = [
      {
        name: "Senior Developer",
        type: "human",
        description: "Experienced software developer",
        unitCost: 150,
        availability: true,
        specifications: {
          experience: "5+ years",
          skills: ["JavaScript", "React", "Node.js"]
        },
        userId
      },
      {
        name: "Junior Developer",
        type: "human",
        description: "Entry-level software developer",
        unitCost: 80,
        availability: true,
        specifications: {
          experience: "1-2 years",
          skills: ["JavaScript", "HTML", "CSS"]
        }
        ,
        userId
      },
      {
        name: "Project Manager",
        type: "human",
        description: "Project management specialist",
        unitCost: 120,
        availability: true,
        specifications: {
          experience: "3+ years",
          skills: ["Agile", "Scrum", "Planning"]
        },
        userId
      },
      {
        name: "Laptop Computer",
        type: "equipment",
        description: "High-performance laptop for development",
        unitCost: 2000,
        availability: true,
        specifications: {
          brand: "Dell",
          model: "XPS 15",
          specs: "16GB RAM, 512GB SSD"
        },
        userId
      },
      {
        name: "Software License",
        type: "material",
        description: "Development tools and software licenses",
        unitCost: 500,
        availability: true,
        specifications: {
          type: "Development Suite",
          duration: "1 year"
        },
        userId
      }
    ];
    
    const createdResources = await Resource.insertMany(defaultResources);
    
    res.status(201).json({
      success: true,
      message: "Default resources created successfully",
      data: createdResources
    });
  } catch (error) {
    console.error("Error seeding resources:", error);
    res.status(500).json({
      success: false,
      error: "Failed to seed resources"
    });
  }
});

// Get all resources for a user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const resources = await Resource.find({ userId })
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch resources"
    });
  }
});

// Get resource by ID
router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found"
      });
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch resource"
    });
  }
});

// Create new resource
router.post("/", async (req, res) => {
  try {
    const { name, type, description, unitCost, availability, specifications } = req.body;

    if (!name || !type || unitCost === undefined) {
      return res.status(400).json({
        success: false,
        error: "Name, type, and unit cost are required"
      });
    }

    const newResource = new Resource({
      name,
      type,
      description,
      unitCost,
      availability: availability !== undefined ? availability : true,
      specifications: specifications || {},
      userId: req.user.id
    });

    const savedResource = await newResource.save();

    res.status(201).json({
      success: true,
      data: savedResource
    });
  } catch (error) {
    console.error("Error creating resource:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create resource",
      details: error.message
    });
  }
});

// Update resource
router.put("/:id", async (req, res) => {
  try {
    const { name, type, description, unitCost, availability, specifications } = req.body;

    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, type, description, unitCost, availability, specifications },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found"
      });
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update resource",
      details: error.message
    });
  }
});

// Delete resource
router.delete("/:id", async (req, res) => {
  try {
    const resource = await Resource.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found"
      });
    }

    res.json({
      success: true,
      message: "Resource deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete resource"
    });
  }
});

module.exports = router;
