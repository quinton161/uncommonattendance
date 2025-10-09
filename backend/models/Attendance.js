const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  lng: {
    type: Number,
    required: true,
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: [true, 'Date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  checkInTime: {
    type: String, // Format: HH:MM
    required: [true, 'Check-in time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Check-in time must be in HH:MM format']
  },
  checkOutTime: {
    type: String, // Format: HH:MM
    default: null,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Check-out time must be in HH:MM format']
  },
  checkInLocation: {
    type: locationSchema,
    required: [true, 'Check-in location is required']
  },
  checkOutLocation: {
    type: locationSchema,
    default: null
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out'],
    default: 'checked-in'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one attendance record per user per date
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Index for better query performance
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ createdAt: -1 });

// Virtual for total hours (if both check-in and check-out exist)
attendanceSchema.virtual('totalHours').get(function() {
  if (!this.checkOutTime) return null;
  
  const checkIn = new Date(`1970-01-01T${this.checkInTime}:00`);
  const checkOut = new Date(`1970-01-01T${this.checkOutTime}:00`);
  
  // Handle case where checkout is next day
  if (checkOut < checkIn) {
    checkOut.setDate(checkOut.getDate() + 1);
  }
  
  const diffMs = checkOut - checkIn;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
});

// Static method to get today's attendance
attendanceSchema.statics.getTodayAttendance = function() {
  const today = new Date().toISOString().split('T')[0];
  return this.find({ date: today }).populate('userId', 'name email profilePicture');
};

// Static method to get currently checked-in users
attendanceSchema.statics.getCurrentlyCheckedIn = function() {
  const today = new Date().toISOString().split('T')[0];
  return this.find({ 
    date: today, 
    status: 'checked-in' 
  }).populate('userId', 'name email profilePicture');
};

// Instance method to check out
attendanceSchema.methods.checkOut = function(location, time) {
  this.checkOutTime = time || new Date().toTimeString().slice(0, 5);
  this.checkOutLocation = location;
  this.status = 'checked-out';
  this.updatedAt = new Date();
  return this.save();
};

// Pre-save middleware to update timestamp
attendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
