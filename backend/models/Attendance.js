const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: [true, 'Date is required']
  },
  checkInTime: {
    type: String, // Format: HH:MM
    default: null
  },
  checkOutTime: {
    type: String, // Format: HH:MM
    default: null
  },
  isLate: {
    type: Boolean,
    default: false
  },
  checkInLocation: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  checkOutLocation: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out', 'absent'],
    default: 'absent'
  },
  notes: {
    type: String,
    default: null,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one attendance record per user per date
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Update the updatedAt field before saving
attendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find attendance by user and date
attendanceSchema.statics.findByUserAndDate = function(userId, date) {
  return this.findOne({ userId, date });
};

// Static method to get attendance stats for a user
attendanceSchema.statics.getStatsForUser = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: {
            $cond: [{ $ne: ['$status', 'absent'] }, 1, 0]
          }
        },
        absentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return { totalDays: 0, presentDays: 0, absentDays: 0, attendanceRate: 0 };
  }

  const result = stats[0];
  result.attendanceRate = result.totalDays > 0 
    ? Math.round((result.presentDays / result.totalDays) * 100) 
    : 0;

  return result;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;

// Additional static helpers used by admin routes
Attendance.getTodayAttendance = async function() {
  const today = new Date().toISOString().split('T')[0];
  return this.find({ date: today, status: { $ne: 'absent' } })
    .populate('userId', 'name email profilePicture role')
    .sort({ createdAt: -1 });
};

Attendance.getCurrentlyCheckedIn = async function() {
  const today = new Date().toISOString().split('T')[0];
  return this.find({ date: today, status: 'checked-in' })
    .populate('userId', 'name email profilePicture role')
    .sort({ createdAt: -1 });
};