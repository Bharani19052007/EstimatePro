const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Report name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['overview', 'financial', 'resources', 'projects', 'custom']
  },
  description: {
    type: String,
    maxlength: 500
  },
  dateRange: {
    type: String,
    required: true,
    enum: ['7days', '30days', '90days', '1year', 'custom']
  },
  startDate: {
    type: Date,
    required: function() {
      return this.dateRange === 'custom';
    }
  },
  endDate: {
    type: Date,
    required: function() {
      return this.dateRange === 'custom';
    }
  },
  data: {
    // Overview data
    totalRevenue: { type: Number, default: 0 },
    activeProjects: { type: Number, default: 0 },
    teamMembers: { type: Number, default: 0 },
    avgProjectValue: { type: Number, default: 0 },
    
    // Financial data
    revenueBreakdown: [{
      period: String,
      amount: Number,
      projectCount: Number
    }],
    projectProfitability: [{
      projectName: String,
      revenue: Number,
      cost: Number,
      profit: Number,
      margin: Number
    }],
    
    // Resources data
    teamPerformance: [{
      name: String,
      projects: Number,
      hours: Number,
      efficiency: Number,
      role: String
    }],
    resourceAllocation: [{
      category: String,
      value: Number,
      fill: String
    }],
    
    // Projects data
    projectStatus: [{
      status: String,
      count: Number,
      percentage: Number
    }],
    recentProjects: [{
      name: String,
      status: String,
      budget: Number,
      actual: Number,
      startDate: Date,
      endDate: Date
    }],
    
    // Chart data
    projectCostsOverTime: [{
      name: String,
      costs: Number,
      projects: Number
    }]
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    default: null
  },
  nextScheduledDate: {
    type: Date,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileType: {
    type: String,
    enum: ['pdf', 'excel', 'csv'],
    default: 'pdf'
  }
}, {
  timestamps: true
});

// Index for faster queries
ReportSchema.index({ generatedBy: 1, type: 1 });
ReportSchema.index({ generatedBy: 1, createdAt: -1 });
ReportSchema.index({ type: 1, dateRange: 1 });

module.exports = mongoose.model('Report', ReportSchema);
