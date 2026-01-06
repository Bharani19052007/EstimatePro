const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'created_project', 'updated_project', 'deleted_project', 
      'created_task', 'updated_task', 'deleted_task', 'completed_task',
      'created_activity', 'updated_activity', 'deleted_activity',
      'assigned_task', 'unassigned_task', 'updated_budget', 'added_team_member'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  timestamp: { type: Date, default: Date.now }
});

// Index for faster queries
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ projectId: 1, timestamp: -1 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
