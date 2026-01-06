const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: [true, "User ID is required"]
  },
  projectName: {
    type: String,
    required: [true, "Project name is required"],
    trim: true,
    minlength: [3, "Project name must be at least 3 characters long"],
    maxlength: [100, "Project name cannot exceed 100 characters"]
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"]
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
    validate: {
      validator: function(value) {
        return value >= this.startDate;
      },
      message: "End date must be after start date"
    }
  },
  status: {
    type: String,
    enum: ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  projects: {
    type: Number,
    default: 0
  },
  completedProjects: {
    type: Number,
    default: 0
  },
  estimations: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  estimatedBudget: {
    type: Number,
    min: [0, "Budget cannot be negative"],
    default: 0
  },
  actualCost: {
    type: Number,
    min: [0, "Actual cost cannot be negative"],
    default: 0
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task"
  }],
  client: {
    name: String,
    email: String,
    company: String
  },
  team: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: String,
    hourlyRate: Number
  }],
  coverImage: {
    data: Buffer,
    contentType: String,
    filename: String
  }
}, {
  timestamps: true
});

// Index for faster queries and to prevent duplicates
ProjectSchema.index({ userId: 1, projectName: 1 }, { unique: true });
ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ status: 1 });

module.exports = mongoose.model("Project", ProjectSchema);
