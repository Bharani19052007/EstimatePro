const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Project",
    required: [true, "Project ID is required"]
  },
  taskName: {
    type: String,
    required: [true, "Task name is required"],
    trim: true,
    minlength: [2, "Task name must be at least 2 characters long"],
    maxlength: [100, "Task name cannot exceed 100 characters"]
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'completed', 'blocked'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  estimatedHours: {
    type: Number,
    min: [0, "Estimated hours cannot be negative"],
    default: 0
  },
  actualHours: {
    type: Number,
    min: [0, "Actual hours cannot be negative"],
    default: 0
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  startDate: Date,
  dueDate: Date,
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task"
  }],
  tags: [String],
  estimatedCost: {
    type: Number,
    min: [0, "Estimated cost cannot be negative"],
    default: 0
  },
  actualCost: {
    type: Number,
    min: [0, "Actual cost cannot be negative"],
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Task", TaskSchema);
