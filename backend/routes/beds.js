const express = require('express');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const { protect, phcOrAdmin, receptionistAllowed } = require('../middleware/auth');

const router = express.Router();

// GET /api/beds/:hospitalId — get all beds for a hospital
router.get('/:hospitalId', protect, receptionistAllowed, async (req, res) => {
  try {
    const beds = await Bed.find({ hospital_id: req.params.hospitalId })
      .populate('current_patient_id', 'name age gender diagnosis admitted_date blood_group attending_doctor patient_id')
      .sort({ bed_number: 1 });
    res.json(beds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/beds — add a single bed
router.post('/', protect, receptionistAllowed, async (req, res) => {
  try {
    const bed = new Bed(req.body);
    await bed.save();
    const io = req.app.get('io');
    io.to(`hospital_${bed.hospital_id}`).emit('bed_updated', bed);
    io.to('admin_room').emit('bed_updated', bed);
    res.status(201).json(bed);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/beds/bulk — create beds in bulk for a hospital
router.post('/bulk', protect, receptionistAllowed, async (req, res) => {
  try {
    const { hospital_id, count, ward, prefix } = req.body;
    const beds = [];
    for (let i = 1; i <= count; i++) {
      beds.push({
        hospital_id,
        bed_number: `${prefix || ward.charAt(0)}-${String(i).padStart(2, '0')}`,
        ward: ward || 'General',
        status: 'Available'
      });
    }
    const created = await Bed.insertMany(beds, { ordered: false });
    res.status(201).json({ created: created.length, beds: created });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/beds/:id/assign — assign patient to bed
router.patch('/:id/assign', protect, receptionistAllowed, async (req, res) => {
  try {
    const { patient_id } = req.body;
    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ message: 'Bed not found' });
    if (bed.status === 'Occupied') return res.status(400).json({ message: 'Bed already occupied' });

    bed.status = 'Occupied';
    bed.current_patient_id = patient_id;
    await bed.save();

    // Also update patient's assigned bed
    await Patient.findByIdAndUpdate(patient_id, { assigned_bed_id: bed._id });

    const io = req.app.get('io');
    const populated = await bed.populate('current_patient_id', 'name age gender diagnosis admitted_date patient_id');
    io.to(`hospital_${bed.hospital_id}`).emit('bed_updated', populated);
    io.to('admin_room').emit('bed_updated', populated);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/beds/:id/release — free a bed
router.patch('/:id/release', protect, receptionistAllowed, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ message: 'Bed not found' });

    if (bed.current_patient_id) {
      await Patient.findByIdAndUpdate(bed.current_patient_id, {
        assigned_bed_id: null,
        status: 'Discharged',
        discharged_date: new Date()
      });
    }

    bed.status = 'Available';
    bed.current_patient_id = null;
    bed.last_sanitized = new Date();
    await bed.save();

    const io = req.app.get('io');
    io.to(`hospital_${bed.hospital_id}`).emit('bed_updated', bed);
    io.to('admin_room').emit('bed_updated', bed);

    res.json(bed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/beds/:id/status — change status
router.patch('/:id/status', protect, receptionistAllowed, async (req, res) => {
  try {
    const { status } = req.body;
    const bed = await Bed.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!bed) return res.status(404).json({ message: 'Bed not found' });

    const io = req.app.get('io');
    io.to(`hospital_${bed.hospital_id}`).emit('bed_updated', bed);
    io.to('admin_room').emit('bed_updated', bed);

    res.json(bed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
