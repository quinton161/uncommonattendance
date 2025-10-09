const express = require('express');
const { query, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's attendance summary
    const todayAttendance = await Attendance.getTodayAttendance();
    const currentlyCheckedIn = await Attendance.getCurrentlyCheckedIn();

    // Get total users count
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });

    // Calculate attendance statistics
    const attendanceStats = {
      totalStudents: totalStudents,
      checkedInToday: todayAttendance.length,
      currentlyPresent: currentlyCheckedIn.length,
      attendanceRate: totalStudents > 0 ? Math.round((todayAttendance.length / totalStudents) * 100) : 0
    };

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentActivity = await Attendance.find({
      date: { $gte: sevenDaysAgoStr }
    })
    .populate('userId', 'name email profilePicture')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        stats: attendanceStats,
        todayAttendance: todayAttendance,
        currentlyCheckedIn: currentlyCheckedIn,
        recentActivity: recentActivity,
        totalUsers: {
          students: totalStudents,
          admins: totalAdmins
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/attendance
// @desc    Get all attendance records with filters
// @access  Private (Admin)
router.get('/attendance', [
  auth,
  adminAuth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000'),
  query('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format'),
  query('status')
    .optional()
    .isIn(['checked-in', 'checked-out'])
    .withMessage('Status must be either checked-in or checked-out'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Attendance route validation errors:', errors.array());
      console.error('Attendance route request query:', req.query);
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
    const query = {};
    
    if (req.query.date) {
      query.date = req.query.date;
    } else if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = req.query.startDate;
      if (req.query.endDate) query.date.$lte = req.query.endDate;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    // Get attendance records
    const attendance = await Attendance.find(query)
      .populate('userId', 'name email profilePicture role')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Attendance.countDocuments(query);

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
        filters: {
          date: req.query.date,
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          status: req.query.status,
          userId: req.query.userId
        }
      }
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance records',
      error: error.message
    });
  }
});

// @route   GET /api/admin/students
// @desc    Get all students
// @access  Private (Admin)
router.get('/students', [
  auth,
  adminAuth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
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
    const query = { role: 'student' };
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get students
    const students = await User.find(query)
      .select('-password')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get attendance summary for each student (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const studentsWithStats = await Promise.all(students.map(async (student) => {
      const attendanceCount = await Attendance.countDocuments({
        userId: student._id,
        date: { $gte: thirtyDaysAgoStr }
      });

      const checkedOutCount = await Attendance.countDocuments({
        userId: student._id,
        date: { $gte: thirtyDaysAgoStr },
        status: 'checked-out'
      });

      return {
        ...student.toObject(),
        attendanceStats: {
          totalDays: attendanceCount,
          completedDays: checkedOutCount,
          attendanceRate: attendanceCount > 0 ? Math.round((checkedOutCount / attendanceCount) * 100) : 0
        }
      };
    }));

    res.json({
      success: true,
      data: {
        students: studentsWithStats,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          search: req.query.search,
          isActive: req.query.isActive
        }
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students',
      error: error.message
    });
  }
});

// @route   GET /api/admin/attendance/export
// @desc    Export attendance data as CSV
// @access  Private (Admin)
router.get('/attendance/export', [
  auth,
  adminAuth,
  query('startDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format'),
  query('format')
    .optional()
    .isIn(['csv', 'json'])
    .withMessage('Format must be either csv or json')
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

    const { startDate, endDate, format = 'csv' } = req.query;

    // Get attendance data
    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    })
    .populate('userId', 'name email')
    .sort({ date: -1, createdAt: -1 });

    if (format === 'json') {
      res.json({
        success: true,
        data: {
          attendance: attendance,
          exportInfo: {
            startDate: startDate,
            endDate: endDate,
            totalRecords: attendance.length,
            exportedAt: new Date().toISOString()
          }
        }
      });
    } else {
      // Generate CSV
      const csvHeader = 'Date,Student Name,Email,Check In Time,Check Out Time,Status,Total Hours,Check In Location,Check Out Location,Notes\n';
      
      const csvData = attendance.map(record => {
        const checkInLoc = `"${record.checkInLocation.lat},${record.checkInLocation.lng}"`;
        const checkOutLoc = record.checkOutLocation ? `"${record.checkOutLocation.lat},${record.checkOutLocation.lng}"` : '';
        const notes = `"${(record.notes || '').replace(/"/g, '""')}"`;
        
        return [
          record.date,
          `"${record.userId.name}"`,
          record.userId.email,
          record.checkInTime,
          record.checkOutTime || '',
          record.status,
          record.totalHours || '',
          checkInLoc,
          checkOutLoc,
          notes
        ].join(',');
      }).join('\n');

      const csv = csvHeader + csvData;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_${startDate}_to_${endDate}.csv`);
      res.send(csv);
    }

  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance data',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/students/:id
// @desc    Update student information
// @access  Private (Admin)
router.put('/students/:id', [
  auth,
  adminAuth,
  query('id')
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isActive } = req.body;

    // Find the student
    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== student.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
    }

    // Update student
    const updatedStudent = await User.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: { student: updatedStudent }
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/students/:id
// @desc    Delete a student (soft delete - set isActive to false)
// @access  Private (Admin)
router.delete('/students/:id', [
  auth,
  adminAuth,
  query('id')
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    // Find the student
    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (permanent === 'true') {
      // Permanent delete - also delete all attendance records
      await Attendance.deleteMany({ userId: id });
      await User.findByIdAndDelete(id);
      
      res.json({
        success: true,
        message: 'Student permanently deleted'
      });
    } else {
      // Soft delete - set isActive to false
      await User.findByIdAndUpdate(id, { isActive: false, updatedAt: new Date() });
      
      res.json({
        success: true,
        message: 'Student deactivated successfully'
      });
    }

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
  }
});

// @route   POST /api/admin/students/bulk-action
// @desc    Perform bulk actions on students
// @access  Private (Admin)
router.post('/students/bulk-action', [
  auth,
  adminAuth
], async (req, res) => {
  try {
    const { action, studentIds } = req.body;

    if (!action || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Action and studentIds array are required'
      });
    }

    let result;
    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: studentIds }, role: 'student' },
          { isActive: true, updatedAt: new Date() }
        );
        break;
      
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: studentIds }, role: 'student' },
          { isActive: false, updatedAt: new Date() }
        );
        break;
      
      case 'delete':
        // Permanent delete - also delete all attendance records
        await Attendance.deleteMany({ userId: { $in: studentIds } });
        result = await User.deleteMany(
          { _id: { $in: studentIds }, role: 'student' }
        );
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Supported actions: activate, deactivate, delete'
        });
    }

    const successMessage = action === 'delete' 
      ? `${result.deletedCount} student(s) permanently deleted`
      : `Bulk ${action} completed successfully`;

    res.json({
      success: true,
      message: successMessage,
      data: {
        modifiedCount: result.modifiedCount || result.deletedCount,
        matchedCount: result.matchedCount || result.deletedCount
      }
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action',
      error: error.message
    });
  }
});

// @route   GET /api/admin/reports/attendance-summary
// @desc    Get attendance summary report
// @access  Private (Admin)
router.get('/reports/attendance-summary', [
  auth,
  adminAuth,
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Default to current month if no dates provided
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const startDate = req.query.startDate || (() => {
      const date = new Date();
      date.setDate(1); // First day of current month
      return date.toISOString().split('T')[0];
    })();


    // Get all students
    const students = await User.find({ role: 'student', isActive: true }).select('name email');
    
    // Get attendance data for the period
    const attendanceData = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('userId', 'name email');

    // Calculate working days (weekdays only) between start and end date
    const calculateWorkingDays = (startDate, endDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let workingDays = 0;
      
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        // Count only weekdays (Monday = 1, Tuesday = 2, ..., Friday = 5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return workingDays;
    };

    const totalWorkingDays = calculateWorkingDays(startDate, endDate);
    const totalStudents = students.length;
    const totalPossibleAttendance = totalStudents * totalWorkingDays;

    
    const attendanceSummary = students.map(student => {
      const studentAttendance = attendanceData.filter(record => 
        record.userId._id.toString() === student._id.toString()
      );
      
      const checkedInDays = studentAttendance.length;
      const completedDays = studentAttendance.filter(record => record.status === 'checked-out').length;
      const lateDays = studentAttendance.filter(record => record.isLate === true).length;
      const attendanceRate = totalWorkingDays > 0 ? Math.round((checkedInDays / totalWorkingDays) * 100) : 0;
      const completionRate = checkedInDays > 0 ? Math.round((completedDays / checkedInDays) * 100) : 0;
      const lateRate = checkedInDays > 0 ? Math.round((lateDays / checkedInDays) * 100) : 0;
      
      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email
        },
        stats: {
          checkedInDays,
          completedDays,
          lateDays,
          attendanceRate,
          completionRate,
          lateRate,
          totalPossibleDays: totalWorkingDays
        }
      };
    });

    // Overall statistics
    const totalLateArrivals = attendanceData.filter(record => record.isLate === true).length;
    const overallStats = {
      totalStudents,
      totalDays: totalWorkingDays,
      totalPossibleAttendance,
      totalActualAttendance: attendanceData.length,
      totalLateArrivals,
      overallAttendanceRate: totalPossibleAttendance > 0 ? 
        Math.round((attendanceData.length / totalPossibleAttendance) * 100) : 0,
      averageCompletionRate: attendanceSummary.length > 0 ? 
        Math.round(attendanceSummary.reduce((sum, s) => sum + s.stats.completionRate, 0) / attendanceSummary.length) : 0,
      averageLateRate: attendanceSummary.length > 0 ? 
        Math.round(attendanceSummary.reduce((sum, s) => sum + s.stats.lateRate, 0) / attendanceSummary.length) : 0
    };

    res.json({
      success: true,
      data: {
        summary: attendanceSummary,
        overallStats,
        period: {
          startDate,
          endDate,
          totalDays: totalWorkingDays
        }
      }
    });

  } catch (error) {
    console.error('Attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate attendance summary',
      error: error.message
    });
  }
});

module.exports = router;
