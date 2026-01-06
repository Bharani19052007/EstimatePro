const express = require("express");
const router = express.Router();
const TeamMember = require("../models/TeamMember");
const auth = require("../middleware/auth");

// Middleware to verify JWT token
router.use(auth);

// Seed default team members for new users
router.post("/seed", async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user already has team members
    const existingMembers = await TeamMember.find({ userId });
    if (existingMembers.length > 0) {
      return res.json({
        success: true,
        message: "Team members already exist",
        data: existingMembers
      });
    }
    
    // Create default team members
    const defaultTeamMembers = [
      {
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+1 234 567 8900",
        role: "developer",
        availability: "available",
        hourlyRate: 75,
        experience: 5,
        skills: ["JavaScript", "React", "Node.js", "MongoDB"],
        currentProject: null,
        notes: "Senior full-stack developer with expertise in MERN stack",
        userId
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        phone: "+1 234 567 8901",
        role: "designer",
        availability: "available",
        hourlyRate: 65,
        experience: 3,
        skills: ["UI/UX Design", "Figma", "Adobe XD", "CSS"],
        currentProject: null,
        notes: "Creative UI/UX designer with modern design principles",
        userId
      },
      {
        name: "Mike Wilson",
        email: "mike.wilson@example.com",
        phone: "+1 234 567 8902",
        role: "manager",
        availability: "busy",
        hourlyRate: 90,
        experience: 8,
        skills: ["Project Management", "Agile", "Scrum", "Team Leadership"],
        currentProject: "Website Redesign",
        notes: "Experienced project manager with PMP certification",
        userId
      },
      {
        name: "Emily Davis",
        email: "emily.davis@example.com",
        phone: "+1 234 567 8903",
        role: "analyst",
        availability: "available",
        hourlyRate: 70,
        experience: 4,
        skills: ["Business Analysis", "Data Analysis", "SQL", "Excel"],
        currentProject: null,
        notes: "Detail-oriented business analyst with strong analytical skills",
        userId
      },
      {
        name: "Alex Chen",
        email: "alex.chen@example.com",
        phone: "+1 234 567 8904",
        role: "developer",
        availability: "unavailable",
        hourlyRate: 80,
        experience: 6,
        skills: ["Python", "Django", "PostgreSQL", "AWS"],
        currentProject: "API Development",
        notes: "Backend developer specializing in Python and cloud technologies",
        userId
      }
    ];
    
    const createdMembers = await TeamMember.insertMany(defaultTeamMembers);
    
    res.status(201).json({
      success: true,
      message: "Default team members created successfully",
      data: createdMembers
    });
  } catch (error) {
    console.error("Error seeding team members:", error);
    res.status(500).json({
      success: false,
      error: "Failed to seed team members"
    });
  }
});

// Get all team members for a user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const teamMembers = await TeamMember.find({ userId })
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch team members"
    });
  }
});

// Get team member by ID
router.get("/:id", async (req, res) => {
  try {
    const teamMember = await TeamMember.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        error: "Team member not found"
      });
    }

    res.json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    console.error("Error fetching team member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch team member"
    });
  }
});

// Create new team member
router.post("/", async (req, res) => {
  try {
    console.log("Request body received:", req.body);
    console.log("User ID from token:", req.user?.id);
    
    const { 
      name, 
      email, 
      phone, 
      role, 
      availability, 
      hourlyRate, 
      experience, 
      skills, 
      currentProject, 
      notes 
    } = req.body;

    // Validate required fields
    if (!name || !email || !role || hourlyRate === undefined) {
      console.log("Validation failed - missing fields:", { name: !!name, email: !!email, role: !!role, hourlyRate: hourlyRate });
      return res.status(400).json({
        success: false,
        error: "Name, email, role, and hourly rate are required"
      });
    }

    // Check if email already exists for this user
    const existingMember = await TeamMember.findOne({ 
      email: email.toLowerCase(), 
      userId: req.user.id 
    });
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: "A team member with this email already exists"
      });
    }

    const newTeamMember = new TeamMember({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      role,
      availability: availability || 'available',
      hourlyRate: parseFloat(hourlyRate),
      experience: experience ? parseInt(experience) : 0,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()).filter(s => s) : []),
      currentProject: currentProject ? currentProject.trim() : null,
      notes: notes ? notes.trim() : '',
      userId: req.user.id
    });

    const savedTeamMember = await newTeamMember.save();

    res.status(201).json({
      success: true,
      data: savedTeamMember
    });
  } catch (error) {
    console.error("Error creating team member:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to create team member",
      details: error.message
    });
  }
});

// Update team member
router.put("/:id", async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      role, 
      availability, 
      hourlyRate, 
      experience, 
      skills, 
      currentProject, 
      notes 
    } = req.body;

    // Check if team member exists and belongs to user
    const existingMember = await TeamMember.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!existingMember) {
      return res.status(404).json({
        success: false,
        error: "Team member not found"
      });
    }

    // If email is being changed, check if new email already exists
    if (email && email.toLowerCase() !== existingMember.email) {
      const emailExists = await TeamMember.findOne({ 
        email: email.toLowerCase(), 
        userId: req.user.id,
        _id: { $ne: req.params.id }
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: "A team member with this email already exists"
        });
      }
    }

    const updateData = {
      name: name ? name.trim() : existingMember.name,
      email: email ? email.toLowerCase().trim() : existingMember.email,
      phone: phone !== undefined ? (phone ? phone.trim() : '') : existingMember.phone,
      role: role || existingMember.role,
      availability: availability || existingMember.availability,
      hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : existingMember.hourlyRate,
      experience: experience !== undefined ? parseInt(experience) : existingMember.experience,
      skills: skills !== undefined ? (Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [])) : existingMember.skills,
      currentProject: currentProject !== undefined ? (currentProject ? currentProject.trim() : null) : existingMember.currentProject,
      notes: notes !== undefined ? (notes ? notes.trim() : '') : existingMember.notes
    };

    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedTeamMember
    });
  } catch (error) {
    console.error("Error updating team member:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to update team member",
      details: error.message
    });
  }
});

// Delete team member
router.delete("/:id", async (req, res) => {
  try {
    const teamMember = await TeamMember.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        error: "Team member not found"
      });
    }

    res.json({
      success: true,
      message: "Team member deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting team member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete team member"
    });
  }
});

module.exports = router;
