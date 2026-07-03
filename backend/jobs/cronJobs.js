const Hospital = require('../models/Hospital');
const Inventory = require('../models/Inventory');
const Alert = require('../models/Alert');

/**
 * Automated Underperformance Flags — runs every hour via cron
 * Flags hospitals if:
 * 1. Doctor attendance < 50% for 3+ consecutive days
 * 2. Critical stock at 0 for 48+ hours
 */
async function runUnderperformanceCheck(io) {
  try {
    const hospitals = await Hospital.find({ is_active: true });

    for (const hospital of hospitals) {
      // ─── CHECK 1: Doctor Attendance ───────────────────────────────────────
      const log = hospital.attendance_log || [];
      if (log.length >= 3) {
        const recent3 = log.slice(-3);
        const lowDays = recent3.filter(d => {
          if (!d.doctors_total || d.doctors_total === 0) return false;
          return (d.doctors_present / d.doctors_total) < 0.5;
        });

        if (lowDays.length === 3) {
          // Check if we already have an active alert for this
          const existing = await Alert.findOne({
            hospital_id: hospital._id,
            type: 'Underperformance',
            is_resolved: false,
            message: { $regex: 'attendance' }
          });

          if (!existing) {
            const alert = await Alert.create({
              hospital_id: hospital._id,
              type: 'Underperformance',
              severity: 'High',
              message: `⚠️ Doctor attendance has been below 50% for 3 consecutive days at ${hospital.name}. Immediate intervention required.`,
              metadata: {
                attendance_log: recent3,
                hospital_name: hospital.name
              }
            });

            console.log(`🚨 Underperformance flag raised for: ${hospital.name}`);
            if (io) {
              io.to('admin_room').emit('new_alert', alert);
              io.to(`hospital_${hospital._id}`).emit('new_alert', alert);
            }
          }
        }
      }

      // ─── CHECK 2: Critical Stock > 48 hours ─────────────────────────────
      const now = new Date();
      const threshold48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const longZeroStock = await Inventory.find({
        hospital_id: hospital._id,
        current_stock: 0,
        zero_stock_since: { $lte: threshold48h }
      });

      for (const item of longZeroStock) {
        const hoursOut = Math.round((now - new Date(item.zero_stock_since)) / (1000 * 60 * 60));

        const existing = await Alert.findOne({
          hospital_id: hospital._id,
          type: 'Stock-Out',
          is_resolved: false,
          'metadata.medicine_name': item.medicine_name
        });

        if (!existing) {
          const alert = await Alert.create({
            hospital_id: hospital._id,
            type: 'Stock-Out',
            severity: 'Critical',
            message: `🔴 ${item.medicine_name} has been out of stock for ${hoursOut} hours at ${hospital.name}. Urgent resupply needed.`,
            metadata: {
              medicine_name: item.medicine_name,
              inventory_id: item._id,
              hours_out: hoursOut,
              hospital_name: hospital.name
            }
          });

          if (io) {
            io.to('admin_room').emit('new_alert', alert);
            io.to(`hospital_${hospital._id}`).emit('new_alert', alert);
          }
        }
      }
    }

    console.log(`✅ Underperformance check complete — ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error('❌ Cron job error:', err.message);
  }
}

module.exports = { runUnderperformanceCheck };
