const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team member name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['developer', 'designer', 'manager', 'analyst', 'consultant']
  },
  availability: {
    type: String,
    required: true,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [0, 'Hourly rate must be positive']
  },
  experience: {
    type: Number,
    min: [0, 'Experience must be positive'],
    default: 0
  },
  skills: {
    type: [String],
    default: []
  },
  currentProject: {
    type: String,
    trim: true,
    default: null
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: ''
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
TeamMemberSchema.index({ userId: 1, role: 1 });
TeamMemberSchema.index({ userId: 1, availability: 1 });
TeamMemberSchema.index({ email: 1 });

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
