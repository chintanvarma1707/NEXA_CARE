const express = require('express');
const Alert = require('../models/Alert');
const Inventory = require('../models/Inventory');
const Hospital = require('../models/Hospital');
const { protect, phcOrAdmin, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/alerts — all alerts (admin) or hospital alerts (PHC)
router.get('/', protect, phcOrAdmin, async (req, res) => {
  try {
    const { resolved, type, severity } = req.query;
    const filter = {};

    if (req.user.role !== 'District_Admin') filter.hospital_id = req.user.hospital_id;
    if (resolved !== undefined) filter.is_resolved = resolved === 'true';
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const alerts = await Alert.find(filter)
      .populate('hospital_id', 'name district type')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/alerts — create alert
router.post('/', protect, phcOrAdmin, async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();

    const io = req.app.get('io');
    const populated = await alert.populate('hospital_id', 'name district');
    io.to('admin_room').emit('new_alert', populated);
    io.to(`hospital_${alert.hospital_id}`).emit('new_alert', populated);

    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/alerts/resolve-all — resolve all restock requests
router.patch('/resolve-all', protect, adminOnly, async (req, res) => {
  try {
    const { severity } = req.query; // optional filter
    const filter = {
      is_resolved: false,
      type: 'Restock-Request'
    };
    if (severity && severity !== 'All') {
      filter.severity = severity;
    }

    const alerts = await Alert.find(filter);
    const io = req.app.get('io');
    let resolvedCount = 0;
    let failedCount = 0;
    let failedReason = '';

    const warehouse = await Hospital.findOne({ type: 'Warehouse' });

    for (const alert of alerts) {
      let canResolve = true;
      let item, whItem, qty = 0;
      
      if (alert.metadata?.inventory_id) {
        item = await Inventory.findById(alert.metadata.inventory_id);
        if (item) {
          qty = Number(alert.metadata.quantity_requested) || 0;
          if (qty > 0 && warehouse) {
            whItem = await Inventory.findOne({ hospital_id: warehouse._id, medicine_name: item.medicine_name });
            if (!whItem || whItem.current_stock < qty) {
              canResolve = false;
              failedReason = `Insufficient stock for ${item.medicine_name}`;
            }
          }
        }
      }

      if (!canResolve) {
        failedCount++;
        continue;
      }

      alert.is_resolved = true;
      alert.resolved_at = new Date();
      alert.resolved_by = req.user.id;
      await alert.save();
      resolvedCount++;

      io.to('admin_room').emit('alert_resolved', { id: alert._id });

      if (item && qty > 0) {
        item.current_stock += qty;
        item.last_restocked = new Date();
        if (item.current_stock > 0) item.zero_stock_since = null;
        await item.save();

        if (whItem) {
          whItem.current_stock -= qty;
          await whItem.save();
        }

        const phcAlert = await Alert.create({
          hospital_id: item.hospital_id,
          type: 'Restock-Approved',
          severity: 'Low',
          message: `Restock Approved: ${qty} ${item.medicine_name} arrived from Central Warehouse.`,
          metadata: { medicine_name: item.medicine_name }
        });

        const populatedAlert = await phcAlert.populate('hospital_id', 'name district');
        io.to(`hospital_${item.hospital_id}`).emit('inventory_updated', item);
        io.to(`hospital_${item.hospital_id}`).emit('new_alert', populatedAlert);
      }
    }

    if (failedCount > 0) {
      return res.status(400).json({ message: `Resolved ${resolvedCount}. Failed ${failedCount} (${failedReason})` });
    }

    res.json({ message: `Successfully resolved ${resolvedCount} restock requests.`, count: resolvedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/alerts/:id/resolve — resolve an alert
router.patch('/:id/resolve', protect, phcOrAdmin, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    
    if (alert.is_resolved) return res.json(alert);

    let item, warehouse, whItem, qty = 0;
    if (alert.type === 'Restock-Request' && alert.metadata?.inventory_id) {
      item = await Inventory.findById(alert.metadata.inventory_id);
      if (item) {
        qty = Number(alert.metadata.quantity_requested) || 0;
        if (qty > 0) {
          warehouse = await Hospital.findOne({ type: 'Warehouse' });
          if (warehouse) {
            whItem = await Inventory.findOne({ hospital_id: warehouse._id, medicine_name: item.medicine_name });
            if (!whItem || whItem.current_stock < qty) {
              return res.status(400).json({ message: `Insufficient stock in Central Warehouse for ${item.medicine_name}. Requested: ${qty}, Available: ${whItem ? whItem.current_stock : 0}` });
            }
          }
        }
      }
    }

    alert.is_resolved = true;
    alert.resolved_at = new Date();
    alert.resolved_by = req.user.id;
    await alert.save();

    const io = req.app.get('io');
    io.to('admin_room').emit('alert_resolved', { id: alert._id });

    if (item && qty > 0) {
      item.current_stock += qty;
      item.last_restocked = new Date();
      if (item.current_stock > 0) item.zero_stock_since = null;
      await item.save();

      if (whItem) {
        whItem.current_stock -= qty;
        await whItem.save();
      }

      const phcAlert = await Alert.create({
        hospital_id: item.hospital_id,
        type: 'Restock-Approved',
        severity: 'Low',
        message: `Restock Approved: ${qty} ${item.medicine_name} arrived from Central Warehouse.`,
        metadata: { medicine_name: item.medicine_name }
      });

      const populatedAlert = await phcAlert.populate('hospital_id', 'name district');
      io.to(`hospital_${item.hospital_id}`).emit('inventory_updated', item);
      io.to(`hospital_${item.hospital_id}`).emit('new_alert', populatedAlert);
    }

    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
