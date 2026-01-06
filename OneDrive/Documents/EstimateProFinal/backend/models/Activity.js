const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Task",
    required: [true, "Task ID is required"]
  },
  activityName: {
    type: String,
    required: [true, "Activity name is required"],
    trim: true,
    maxlength: [100, "Activity name cannot exceed 100 characters"]
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  estimatedCost: {
    type: Number,
    min: [0, "Estimated cost cannot be negative"],
    default: 0
  },
  actualCost: {
    type: Number,
    min: [0, "Actual cost cannot be negative"],
    default: 0
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
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  date: Date,
  attachments: [{
    filename: String,
    contentType: String,
    data: Buffer
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Activity", ActivitySchema);
