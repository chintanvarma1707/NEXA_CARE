const express = require('express');
const Hospital = require('../models/Hospital');
const { protect, adminOnly, phcOrAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/hospitals — all hospitals (admin) or own hospital (PHC)
router.get('/', protect, phcOrAdmin, async (req, res) => {
  try {
    const filter = req.user.role === 'District_Admin' ? {} : { _id: req.user.hospital_id };
    const hospitals = await Hospital.find(filter).sort({ name: 1 });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/hospitals/:id
router.get('/:id', protect, phcOrAdmin, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/hospitals — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const hospital = new Hospital(req.body);
    await hospital.save();
    res.status(201).json(hospital);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/hospitals/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/hospitals/:id/attendance — log daily attendance
router.post('/:id/attendance', protect, phcOrAdmin, async (req, res) => {
  try {
    const { doctors_present, doctors_total, date } = req.body;
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);

    // Remove existing entry for today if any
    hospital.attendance_log = hospital.attendance_log.filter(
      d => new Date(d.date).toDateString() !== today.toDateString()
    );

    hospital.attendance_log.push({ date: today, doctors_present, doctors_total });

    // Keep only last 30 days
    if (hospital.attendance_log.length > 30) {
      hospital.attendance_log = hospital.attendance_log.slice(-30);
    }

    await hospital.save();

    const io = req.app.get('io');
    io.to('admin_room').emit('attendance_updated', { hospital_id: hospital._id, doctors_present, doctors_total });

    res.json({ message: 'Attendance logged', hospital });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
