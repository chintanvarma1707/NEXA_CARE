const express = require('express');
const Hospital = require('../models/Hospital');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const Inventory = require('../models/Inventory');
const Alert = require('../models/Alert');
const axios = require('axios');
const { protect, adminOnly, phcOrAdmin } = require('../middleware/auth');

const router = express.Router();
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /api/dashboard/admin — aggregated data for District Admin
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const hospitals = await Hospital.find({ is_active: true });
    const hospitalIds = hospitals.map(h => h._id);

    // Aggregate beds
    const bedStats = await Bed.aggregate([
      { $match: { hospital_id: { $in: hospitalIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const bedSummary = { Available: 0, Occupied: 0, Maintenance: 0, Reserved: 0 };
    bedStats.forEach(b => { bedSummary[b._id] = b.count; });
    const totalBeds = Object.values(bedSummary).reduce((a, b) => a + b, 0);

    // Patient count
    const totalPatients = await Patient.countDocuments({ hospital_id: { $in: hospitalIds }, status: 'Admitted' });

    // Critical inventory
    const criticalStock = await Inventory.find({
      hospital_id: { $in: hospitalIds },
      $expr: { $lte: ['$current_stock', '$minimum_threshold'] }
    }).populate('hospital_id', 'name district');

    // Active alerts
    const activeAlerts = await Alert.find({ hospital_id: { $in: hospitalIds }, is_resolved: false })
      .populate('hospital_id', 'name district')
      .sort({ createdAt: -1 })
      .limit(20);

    // Per-hospital summary
    const hospitalSummaries = await Promise.all(hospitals.map(async (h) => {
      const beds = await Bed.find({ hospital_id: h._id });
      const available = beds.filter(b => b.status === 'Available').length;
      const occupied = beds.filter(b => b.status === 'Occupied').length;
      const lowStock = await Inventory.countDocuments({
        hospital_id: h._id,
        $expr: { $lte: ['$current_stock', '$minimum_threshold'] }
      });
      const alertCount = await Alert.countDocuments({ hospital_id: h._id, is_resolved: false });

      return {
        _id: h._id,
        name: h.name,
        type: h.type,
        district: h.district,
        location: h.location,
        total_beds: h.total_beds,
        available_beds: available,
        occupied_beds: occupied,
        occupancy_rate: h.total_beds > 0 ? Math.round((occupied / h.total_beds) * 100) : 0,
        low_stock_count: lowStock,
        alert_count: alertCount,
        recent_attendance_rate: h.recent_attendance_rate,
        doctor_count: h.doctor_count
      };
    }));

    // AI redistribution recommendations
    let redistributionRecs = [];
    try {
      const invData = await Inventory.find({ hospital_id: { $in: hospitalIds } })
        .populate('hospital_id', 'name district');
      const aiPayload = {
        hospitals: hospitalSummaries.map(h => ({ id: h._id, name: h.name })),
        inventory: invData.map(i => ({
          hospital_id: i.hospital_id._id,
          hospital_name: i.hospital_id.name,
          medicine_name: i.medicine_name,
          current_stock: i.current_stock,
          minimum_threshold: i.minimum_threshold
        }))
      };
      const aiRes = await axios.post(`${AI_URL}/api/ai/redistribute`, aiPayload, { timeout: 5000 });
      redistributionRecs = aiRes.data.recommendations || [];
    } catch (_) {
      // AI service might not be running, gracefully skip
    }

    res.json({
      overview: {
        total_hospitals: hospitals.length,
        total_beds: totalBeds,
        ...bedSummary,
        occupancy_rate: totalBeds > 0 ? Math.round((bedSummary.Occupied / totalBeds) * 100) : 0,
        total_patients: totalPatients,
        critical_stock_items: criticalStock.length,
        active_alerts: activeAlerts.length
      },
      hospitals: hospitalSummaries,
      critical_stock: criticalStock.slice(0, 10),
      alerts: activeAlerts,
      redistribution: redistributionRecs
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/phc/:hospitalId — PHC manager dashboard
router.get('/phc/:hospitalId', protect, phcOrAdmin, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    const [beds, patients, inventory, alerts] = await Promise.all([
      Bed.find({ hospital_id: hospital._id }).populate('current_patient_id', 'name age gender diagnosis admitted_date patient_id blood_group attending_doctor'),
      Patient.find({ hospital_id: hospital._id, status: 'Admitted' }),
      Inventory.find({ hospital_id: hospital._id }).sort({ medicine_name: 1 }),
      Alert.find({ hospital_id: hospital._id, is_resolved: false }).sort({ createdAt: -1 }).limit(10)
    ]);

    const bedSummary = {
      total: beds.length,
      available: beds.filter(b => b.status === 'Available').length,
      occupied: beds.filter(b => b.status === 'Occupied').length,
      maintenance: beds.filter(b => b.status === 'Maintenance').length
    };

    const invSummary = {
      total: inventory.length,
      good: inventory.filter(i => i.current_stock > i.minimum_threshold * 2).length,
      low: inventory.filter(i => i.current_stock > 0 && i.current_stock <= i.minimum_threshold).length,
      critical: inventory.filter(i => i.current_stock === 0).length
    };

    // AI forecast for this hospital
    let forecasts = [];
    try {
      const aiPayload = {
        hospital_id: hospital._id,
        inventory: inventory.map(i => ({
          medicine_name: i.medicine_name,
          current_stock: i.current_stock,
          minimum_threshold: i.minimum_threshold,
          usage_log: i.usage_log.slice(-30)
        }))
      };
      const aiRes = await axios.post(`${AI_URL}/api/ai/forecast`, aiPayload, { timeout: 5000 });
      forecasts = aiRes.data.predictions || [];
    } catch (_) {
      // AI graceful fallback
    }

    res.json({
      hospital,
      beds,
      bed_summary: bedSummary,
      patients,
      inventory,
      inventory_summary: invSummary,
      alerts,
      forecasts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
