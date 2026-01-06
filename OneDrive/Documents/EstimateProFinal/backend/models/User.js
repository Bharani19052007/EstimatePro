const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: { 
    type: String, 
    unique: true,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: [6, "Password must be at least 6 characters long"]
  },
  // Profile fields
  avatar: {
    data: Buffer,
    contentType: String,
    filename: String
  },
  location: {
    type: String,
    maxlength: [100, "Location cannot exceed 100 characters"],
    default: ""
  },
  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"],
    default: ""
  },
  // Profile statistics
  projects: {
    type: Number,
    default: 0
  },
  completedProjects: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    min: [0, "Hourly rate cannot be negative"],
    default: 0
  },
  skills: [String],
  role: {
    type: String,
    enum: ['project_manager', 'developer', 'designer', 'analyst', 'tester', 'other'],
    default: 'developer'
  },
  department: {
    type: String,
    maxlength: [100, "Department cannot exceed 100 characters"]
  },
  // Privacy settings
  profileVisibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  showEmail: {
    type: Boolean,
    default: false
  },
  showLocation: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", UserSchema);
