const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Attendance = require('../models/Attendance');

// Get all doctors for a hospital
router.get('/:hospitalId', async (req, res) => {
  try {
    const doctors = await Doctor.find({ hospital_id: req.params.hospitalId }).lean();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendances = await Attendance.find({
      hospital_id: req.params.hospitalId,
      date: today
    }).lean();

    const attendanceMap = {};
    attendances.forEach(a => {
      attendanceMap[a.doctor_id.toString()] = a.status;
    });

    const enrichedDoctors = doctors.map(d => ({
      ...d,
      today_status: attendanceMap[d._id.toString()] || 'Not Marked'
    }));

    res.json(enrichedDoctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new doctor
router.post('/', async (req, res) => {
  try {
    const newDoctor = new Doctor(req.body);
    const saved = await newDoctor.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get attendance for a hospital (last 7 days by default)
router.get('/:hospitalId/attendance', async (req, res) => {
  try {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 7);
    limitDate.setHours(0,0,0,0);
    
    const attendance = await Attendance.find({ 
      hospital_id: req.params.hospitalId,
      date: { $gte: limitDate }
    }).populate('doctor_id');
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance
router.post('/attendance', async (req, res) => {
  try {
    const { doctor_id, hospital_id, date, status, notes, marked_by } = req.body;
    
    // Normalize date to midnight
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { doctor_id, date: attendanceDate },
      { hospital_id, status, notes, marked_by },
      { new: true, upsert: true }
    );
    
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
