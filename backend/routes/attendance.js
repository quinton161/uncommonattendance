const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Attendance = require('../models/Attendance');
const { auth, studentAuth } = require('../middleware/auth');

const router = express.Router();

// Helper function to get current date and time
const getCurrentDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5); // HH:MM
  return { date, time };
};

// @route   POST /api/attendance/check-in
// @desc    Check in student
// @access  Private (Student)
router.post('/check-in', [
  auth,
  studentAuth,
  body('location.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { location, notes = '' } = req.body;
    const { date, time } = getCurrentDateTime();

    // Check if user already checked in today
    const existingAttendance = await Attendance.findOne({
      userId: req.user.userId,
      date: date
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today',
        data: {
          attendance: existingAttendance
        }
      });
    }

    // Check if student is late (after 9:00 AM)
    const checkInHour = parseInt(time.split(':')[0]);
    const checkInMinute = parseInt(time.split(':')[1]);
    const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0);

    // Create new attendance record
    const attendance = new Attendance({
      userId: req.user.userId,
      date: date,
      checkInTime: time,
      checkInLocation: {
        lat: location.lat,
        lng: location.lng
      },
      status: 'checked-in',
      isLate: isLate,
      notes: notes
    });

    await attendance.save();

    // Populate user data for response
    await attendance.populate('userId', 'name email profilePicture');

    res.status(201).json({
      success: true,
      message: isLate ? 'Check-in successful - You are late! Lessons start at 9:00 AM' : 'Check-in successful',
      data: {
        attendance: attendance
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Check-in failed',
      error: error.message
    });
  }
});

// @route   PUT /api/attendance/check-out
// @desc    Check out student
// @access  Private (Student)
router.put('/check-out', [
  auth,
  studentAuth,
  body('location.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { location, notes } = req.body;
    const { date, time } = getCurrentDateTime();

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      userId: req.user.userId,
      date: date
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today. Please check in first.'
      });
    }

    if (attendance.status === 'checked-out') {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today',
        data: {
          attendance: attendance
        }
      });
    }

    // Update attendance record with check-out info
    attendance.checkOutTime = time;
    attendance.checkOutLocation = {
      lat: location.lat,
      lng: location.lng
    };
    attendance.status = 'checked-out';
    
    if (notes) {
      attendance.notes = attendance.notes ? `${attendance.notes}\nCheck-out: ${notes}` : `Check-out: ${notes}`;
    }

    await attendance.save();

    // Populate user data for response
    await attendance.populate('userId', 'name email profilePicture');

    res.json({
      success: true,
      message: 'Check-out successful',
      data: {
        attendance: attendance,
        totalHours: attendance.totalHours
      }
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Check-out failed',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/status
// @desc    Get current day attendance status for logged-in student
// @access  Private (Student)
router.get('/status', auth, studentAuth, async (req, res) => {
  try {
    const { date } = getCurrentDateTime();

    const attendance = await Attendance.findOne({
      userId: req.user.userId,
      date: date
    }).populate('userId', 'name email profilePicture');

    res.json({
      success: true,
      data: {
        attendance: attendance,
        date: date,
        hasCheckedIn: !!attendance,
        hasCheckedOut: attendance ? attendance.status === 'checked-out' : false,
        totalHours: attendance ? attendance.totalHours : null
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance status',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/history
// @desc    Get attendance history for logged-in student
// @access  Private (Student)
router.get('/history', [
  auth,
  studentAuth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = { userId: req.user.userId };
    
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = req.query.startDate;
      if (req.query.endDate) query.date.$lte = req.query.endDate;
    }

    // Get attendance records
    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email profilePicture');

    // Get total count for pagination
    const total = await Attendance.countDocuments(query);

    // Calculate statistics
    const stats = {
      totalDays: total,
      checkedOutDays: await Attendance.countDocuments({
        ...query,
        status: 'checked-out'
      }),
      currentlyCheckedIn: await Attendance.countDocuments({
        ...query,
        status: 'checked-in'
      })
    };

    res.json({
      success: true,
      data: {
        attendance: attendance,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit)
        },
        stats: stats
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance history',
      error: error.message
    });
  }
});

module.exports = router;
