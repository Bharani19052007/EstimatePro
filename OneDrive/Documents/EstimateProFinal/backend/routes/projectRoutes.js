const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const Project = require("../models/Project");
const ActivityLog = require("../models/ActivityLog");
const auth = require("../middleware/auth");
const router = express.Router();

// Middleware to verify JWT token
router.use(auth);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Create project
router.post("/", upload.single('coverImage'), async (req, res) => {
  try {
    console.log("Received project creation request:");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    
    const { projectName, startDate, endDate, userId, description, status, priority, estimatedBudget, client } = req.body;
    
    if (!projectName || !startDate || !endDate || !userId) {
      console.log("Missing required fields:", { projectName, startDate, endDate, userId });
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields. Please provide projectName, startDate, endDate, and userId." 
      });
    }

    const projectData = {
      projectName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description: description || "",
      userId: userId,
      status: status || 'planning',
      priority: priority || 'medium',
      estimatedBudget: estimatedBudget || 0,
      client: client ? JSON.parse(client) : {}
    };

    // Add cover image if uploaded
    if (req.file) {
      projectData.coverImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname
      };
      console.log("Cover image added to project data");
    }

    console.log("Attempting to save project:", projectData);
    const savedProject = await Project.create(projectData);
    
    // Log activity
    await ActivityLog.create({
      userId: userId,
      action: 'created_project',
      projectId: savedProject._id,
      details: {
        projectId: savedProject._id,
        projectName: projectName,
        startDate: startDate,
        endDate: endDate
      }
    });
    
    console.log("Project saved successfully:", savedProject);
    res.status(201).json({
      success: true,
      data: savedProject
    });
    
  } catch (err) {
    console.error("Error creating project:", err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false,
        error: messages.join('. ') 
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: "A project with this name already exists for this user." 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      success: false,
      error: "Server error while creating project",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Project API is working!' });
});

// Get projects by user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Fetching projects for user:", userId);
    console.log("User object:", req.user);
    
    // First, let's see all projects in the database
    const allProjects = await Project.find({});
    console.log("Total projects in database:", allProjects.length);
    
    // Now let's see projects for this specific user
    const projects = await Project.find({ userId })
      .sort({ startDate: 1 })
      .lean(); // Use lean() for better performance and to get plain JavaScript objects
      
    console.log("Projects found for user:", projects.length);
    console.log("Project userIds:", allProjects.map(p => ({ name: p.projectName, userId: p.userId })));
      
    // Convert Buffer data to base64 for each project
    const projectsWithBase64Images = projects.map(project => {
      if (project.coverImage && project.coverImage.data) {
        return {
          ...project,
          coverImage: {
            ...project.coverImage,
            data: project.coverImage.data.toString('base64')
          }
        };
      }
      return project;
    });
      
    res.json({ 
      success: true,
      data: projectsWithBase64Images 
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ 
      success: false,
      error: "Error fetching projects",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get single project by ID
router.get("/single/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid project ID format" 
      });
    }
    
    const project = await Project.findById(req.params.id).lean();
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: "Project not found" 
      });
    }
    
    // Convert Buffer data to base64 if exists
    if (project.coverImage && project.coverImage.data) {
      project.coverImage = {
        ...project.coverImage,
        data: project.coverImage.data.toString('base64')
      };
    }
      
    res.json({ 
      success: true,
      data: project 
    });
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ 
      success: false,
      error: "Error fetching project",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update project
router.put("/:id", upload.single('coverImage'), async (req, res) => {
  try {
    console.log("Received project update request:", req.params.id, req.body);
    console.log("File:", req.file);
    
    const { projectName, startDate, endDate, description, status, priority, estimatedBudget, client } = req.body;
    const projectId = req.params.id;
    
    if (!projectName || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields. Please provide projectName, startDate, and endDate." 
      });
    }

    const projectData = {
      projectName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description: description || "",
      status: status || 'planning',
      priority: priority || 'medium',
      estimatedBudget: estimatedBudget || 0,
      client: client ? JSON.parse(client) : {}
    };

    // Add cover image if uploaded
    if (req.file) {
      projectData.coverImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname
      };
      console.log("Cover image added to project data");
    }

    console.log("Attempting to update project:", projectId, projectData);
    const updatedProject = await Project.findByIdAndUpdate(
      projectId, 
      projectData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedProject) {
      return res.status(404).json({ 
        success: false,
        error: "Project not found" 
      });
    }
    
    console.log("Project updated successfully:", updatedProject);
    res.status(200).json({
      success: true,
      data: updatedProject
    });
    
  } catch (err) {
    console.error("Error updating project:", err);
    
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
      error: "Server error while updating project",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    console.log("Received project delete request:", req.params.id);
    
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    
    if (!deletedProject) {
      return res.status(404).json({ 
        success: false,
        error: "Project not found" 
      });
    }
    
    console.log("Project deleted successfully:", deletedProject);
    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });
    
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while deleting project",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
