const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['human', 'equipment', 'material', 'other'],
    required: [true, 'Resource type is required']
  },
  description: {
    type: String,
    maxlength: 500
  },
  unitCost: {
    type: Number,
    required: [true, 'Unit cost is required'],
    min: 0
  },
  availability: {
    type: Boolean,
    default: true
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
ResourceSchema.index({ userId: 1, type: 1 });
ResourceSchema.index({ name: 1 });

module.exports = mongoose.model('Resource', ResourceSchema);
