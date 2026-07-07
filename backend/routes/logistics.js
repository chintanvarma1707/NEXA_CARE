const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const Transfer = require('../models/Transfer');
const Referral = require('../models/Referral');
const Inventory = require('../models/Inventory');
const Patient = require('../models/Patient');
const Bed = require('../models/Bed');

// ================= TRANSFERS =================

// GET /api/logistics/transfers
router.get('/transfers', protect, async (req, res) => {
  try {
    const { hospital_id } = req.query;
    if (!hospital_id) return res.status(400).json({ message: 'hospital_id required' });

    const transfers = await Transfer.find({
      $or: [{ from_hospital: hospital_id }, { to_hospital: hospital_id }]
    })
    .populate('from_hospital', 'name type')
    .populate('to_hospital', 'name type')
    .sort('-createdAt');

    res.json(transfers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/logistics/transfers (Admin creates transfer)
router.post('/transfers', protect, requireRole('District_Admin'), async (req, res) => {
  try {
    const { item_name, quantity, from_hospital, to_hospital } = req.body;
    
    // Create the transfer record (Pending dispatch)
    const transfer = await Transfer.create({
      item_name,
      quantity,
      from_hospital,
      to_hospital,
      initiated_by: req.user._id,
      status: 'Pending'
    });

    const populatedTransfer = await Transfer.findById(transfer._id)
      .populate('from_hospital', 'name type')
      .populate('to_hospital', 'name type');

    const io = req.app.get('io');
    io.emit('logistics_update'); // global logistics refresh

    res.status(201).json(populatedTransfer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/logistics/transfers/:id/dispatch (Sender dispatches)
router.patch('/transfers/:id/dispatch', protect, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    
    // Decrease sender's inventory
    const senderInventory = await Inventory.findOne({ hospital_id: transfer.from_hospital, medicine_name: transfer.item_name });
    if (senderInventory && senderInventory.current_stock >= transfer.quantity) {
      senderInventory.current_stock -= transfer.quantity;
      await senderInventory.save();
    } else {
      return res.status(400).json({ message: 'Insufficient stock to dispatch' });
    }

    transfer.status = 'In-Transit';
    await transfer.save();

    const populatedTransfer = await Transfer.findById(transfer._id)
      .populate('from_hospital', 'name type')
      .populate('to_hospital', 'name type');

    const io = req.app.get('io');
    io.emit('logistics_update');
    io.emit('inventory_updated');

    res.json(populatedTransfer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/logistics/transfers/:id/receive (Receiver receives)
router.patch('/transfers/:id/receive', protect, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status !== 'In-Transit') return res.status(400).json({ message: 'Transfer is not In-Transit' });
    
    // Increase receiver's inventory
    let receiverInventory = await Inventory.findOne({ hospital_id: transfer.to_hospital, medicine_name: transfer.item_name });
    if (receiverInventory) {
      receiverInventory.current_stock += transfer.quantity;
      await receiverInventory.save();
    } else {
      await Inventory.create({
        hospital_id: transfer.to_hospital,
        medicine_name: transfer.item_name,
        category: 'Other', // Fallback, would be better to fetch original category
        current_stock: transfer.quantity,
        minimum_threshold: 50
      });
    }

    transfer.status = 'Received';
    await transfer.save();

    const populatedTransfer = await Transfer.findById(transfer._id)
      .populate('from_hospital', 'name type')
      .populate('to_hospital', 'name type');

    const io = req.app.get('io');
    io.emit('logistics_update');
    io.emit('inventory_updated');

    res.json(populatedTransfer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= REFERRALS =================

// GET /api/logistics/referrals
router.get('/referrals', protect, async (req, res) => {
  try {
    const { hospital_id } = req.query;
    if (!hospital_id) return res.status(400).json({ message: 'hospital_id required' });

    const referrals = await Referral.find({
      $or: [{ from_hospital: hospital_id }, { to_hospital: hospital_id }]
    })
    .populate('from_hospital', 'name type')
    .populate('to_hospital', 'name type')
    .sort('-createdAt');

    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/logistics/referrals (PHC refers patient)
router.post('/referrals', protect, async (req, res) => {
  try {
    const referral = await Referral.create(req.body);
    const populatedReferral = await Referral.findById(referral._id)
      .populate('from_hospital', 'name type')
      .populate('to_hospital', 'name type');

    if (req.body.patient_id) {
      const patient = await Patient.findById(req.body.patient_id);
      if (patient) {
        // Free up the bed at PHC
        if (patient.assigned_bed_id) {
          await Bed.findByIdAndUpdate(patient.assigned_bed_id, {
            status: 'Available',
            current_patient_id: null
          });
        }
        
        patient.is_referred = true;
        patient.referred_to = populatedReferral.to_hospital.name;
        patient.referral_reason = req.body.reason;
        patient.assigned_bed_id = null;
        await patient.save();
      }
    }

    const io = req.app.get('io');
    io.emit('logistics_update');
    io.emit('patient_updated'); // Trigger dashboard refresh for patients

    res.status(201).json(populatedReferral);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/logistics/referrals/:id/accept (CHC accepts patient)
router.patch('/referrals/:id/accept', protect, async (req, res) => {
  try {
    const referral = await Referral.findByIdAndUpdate(req.params.id, { status: 'Accepted' }, { new: true })
      .populate('from_hospital', 'name type')
      .populate('to_hospital', 'name type');

    const io = req.app.get('io');

    if (referral.patient_id) {
      const patient = await Patient.findById(referral.patient_id);
      if (patient) {
        let assignedBedId = null;
        
        // Auto-admit to ICU if requested
        if (referral.reason && referral.reason.toLowerCase().includes('icu')) {
          const icuBed = await Bed.findOne({
            hospital_id: referral.to_hospital._id,
            ward: 'ICU',
            status: 'Available'
          });
          
          if (icuBed) {
            icuBed.status = 'Occupied';
            icuBed.current_patient_id = patient._id;
            await icuBed.save();
            assignedBedId = icuBed._id;
            io.emit('bed_updated');
          }
        }
        
        // Transfer patient to CHC
        patient.hospital_id = referral.to_hospital._id;
        patient.is_referred = false;
        patient.referred_to = '';
        patient.referral_reason = '';
        patient.assigned_bed_id = assignedBedId;
        await patient.save();
        io.emit('patient_updated');
      }
    }

    io.emit('logistics_update');

    res.json(referral);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
