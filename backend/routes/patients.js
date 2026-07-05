const express = require('express');
const Patient = require('../models/Patient');
const Bed = require('../models/Bed');
const { protect, phcOrAdmin, receptionistAllowed } = require('../middleware/auth');

const router = express.Router();

// GET /api/patients/:hospitalId
router.get('/:hospitalId', protect, receptionistAllowed, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { hospital_id: req.params.hospitalId };
    if (status) filter.status = status;

    const patients = await Patient.find(filter)
      .populate('assigned_bed_id', 'bed_number ward')
      .sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/single/:id
router.get('/single/:id', protect, receptionistAllowed, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('assigned_bed_id hospital_id');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/patients — admit new patient
router.post('/', protect, receptionistAllowed, async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();

    // If bed_id provided, assign it
    if (req.body.assigned_bed_id) {
      await Bed.findByIdAndUpdate(req.body.assigned_bed_id, {
        status: 'Occupied',
        current_patient_id: patient._id
      });
    }

    const io = req.app.get('io');
    io.to(`hospital_${patient.hospital_id}`).emit('patient_admitted', patient);
    io.to('admin_room').emit('patient_admitted', patient);

    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/patients/:id — update patient
router.put('/:id', protect, receptionistAllowed, async (req, res) => {
  try {
    const oldPatient = await Patient.findById(req.params.id);
    if (!oldPatient) return res.status(404).json({ message: 'Patient not found' });

    const newBedId = req.body.assigned_bed_id;
    const oldBedId = oldPatient.assigned_bed_id ? oldPatient.assigned_bed_id.toString() : null;

    // Handle bed change
    if (newBedId !== oldBedId) {
      if (oldBedId) {
        await Bed.findByIdAndUpdate(oldBedId, { status: 'Available', current_patient_id: null });
      }
      if (newBedId) {
        await Bed.findByIdAndUpdate(newBedId, { status: 'Occupied', current_patient_id: oldPatient._id });
      }
    }

    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    const io = req.app.get('io');
    io.to(`hospital_${patient.hospital_id}`).emit('patient_updated', patient);
    io.to(`hospital_${patient.hospital_id}`).emit('bed_updated');
    res.json(patient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/patients/:id — discharge
router.delete('/:id', protect, receptionistAllowed, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Free bed if assigned
    if (patient.assigned_bed_id) {
      await Bed.findByIdAndUpdate(patient.assigned_bed_id, {
        status: 'Available',
        current_patient_id: null
      });
    }

    patient.status = 'Discharged';
    patient.discharged_date = new Date();
    await patient.save();

    const io = req.app.get('io');
    io.to(`hospital_${patient.hospital_id}`).emit('patient_discharged', patient);
    io.to('admin_room').emit('patient_discharged', patient);

    res.json({ message: 'Patient discharged', patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
