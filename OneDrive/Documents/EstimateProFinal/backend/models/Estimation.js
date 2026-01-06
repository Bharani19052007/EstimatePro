const mongoose = require("mongoose");

const EstimationSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Project",
    required: [true, "Project ID is required"]
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: [true, "User ID is required"]
  },
  projectName: {
    type: String,
    required: [true, "Project name is required"],
    trim: true
  },
  costBreakdown: [{
    category: {
      type: String,
      required: true
    },
    estimatedCost: {
      type: Number,
      required: true,
      min: 0
    },
    actualCost: {
      type: Number,
      default: 0,
      min: 0
    },
    description: String
  }],
  resources: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['human', 'equipment', 'material', 'other'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  timeline: {
    phases: [{
      name: {
        type: String,
        required: true
      },
      duration: {
        type: Number,
        required: true,
        min: 0
      },
      startDate: Date,
      endDate: Date,
      dependencies: [String],
      status: {
        type: String,
        enum: ['planned', 'in_progress', 'completed', 'delayed'],
        default: 'planned'
      }
    }],
    totalDuration: {
      type: Number,
      default: 0
    },
    startDate: Date,
    endDate: Date
  },
  contingency: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  finalCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'approved', 'rejected'],
    default: 'draft'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  teamSize: {
    type: Number,
    default: 1,
    min: 1
  },
  duration: {
    type: Number,
    default: 1,
    min: 1
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  attachments: [{
    filename: String,
    contentType: String,
    data: Buffer,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Index for faster queries
EstimationSchema.index({ projectId: 1, createdAt: -1 });
EstimationSchema.index({ userId: 1, createdAt: -1 });
EstimationSchema.index({ status: 1 });

// Calculate total cost before saving
EstimationSchema.pre('save', function(next) {
  console.log('Pre-save hook triggered');
  console.log('Current costBreakdown:', this.costBreakdown);
  console.log('Current contingency:', this.contingency);
  
  if (this.isModified('costBreakdown') || this.isModified('contingency')) {
    const subtotal = this.costBreakdown.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
    const contingencyAmount = subtotal * (this.contingency / 100);
    this.totalCost = subtotal;
    this.finalCost = subtotal + contingencyAmount;
    
    console.log('Calculated subtotal:', subtotal);
    console.log('Calculated contingencyAmount:', contingencyAmount);
    console.log('Set totalCost:', this.totalCost);
    console.log('Set finalCost:', this.finalCost);
  }
  
  // Calculate progress based on timeline phases
  if (this.isModified('timeline') || this.isNew) {
    const phases = this.timeline?.phases || [];
    if (phases.length > 0) {
      const completedPhases = phases.filter(phase => phase.status === 'completed').length;
      const totalPhases = phases.length;
      this.progress = Math.round((completedPhases / totalPhases) * 100);
    } else {
      this.progress = 0;
    }
  }
  
  next();
});

// Update project estimation count when estimation is created
EstimationSchema.post('save', async function(doc) {
  try {
    const Project = mongoose.model('Project');
    await Project.findByIdAndUpdate(doc.projectId, {
      $inc: { estimations: 1 }
    });
  } catch (error) {
    console.error('Error updating project estimation count:', error);
  }
});

// Update project estimation count when estimation is deleted
EstimationSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  try {
    const Project = mongoose.model('Project');
    await Project.findByIdAndUpdate(doc.projectId, {
      $inc: { estimations: -1 }
    });
  } catch (error) {
    console.error('Error updating project estimation count:', error);
  }
});

module.exports = mongoose.model("Estimation", EstimationSchema);
