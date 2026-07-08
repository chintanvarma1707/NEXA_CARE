const express = require('express');
const Inventory = require('../models/Inventory');
const Alert = require('../models/Alert');
const StockUsage = require('../models/StockUsage');
const { protect, phcOrAdmin, inventoryAllowed } = require('../middleware/auth');

const router = express.Router();

// GET /api/inventory/:hospitalId
router.get('/:hospitalId', protect, inventoryAllowed, async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = { hospital_id: req.params.hospitalId };
    if (category) filter.category = category;

    let items = await Inventory.find(filter).sort({ medicine_name: 1 }).lean();

    if (status === 'critical') items = items.filter(i => i.current_stock === 0);
    if (status === 'low') items = items.filter(i => i.current_stock > 0 && i.current_stock <= i.minimum_threshold);

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/inventory — add medicine
router.post('/', protect, inventoryAllowed, async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();

    const io = req.app.get('io');
    io.to(`hospital_${item.hospital_id}`).emit('inventory_updated', item);
    io.to('admin_room').emit('inventory_updated', item);

    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/inventory/:id — update stock
router.put('/:id', protect, inventoryAllowed, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    const prevStock = item.current_stock;
    Object.assign(item, req.body);

    // Track zero stock timestamp
    if (item.current_stock === 0 && prevStock > 0) {
      item.zero_stock_since = new Date();
      // Create alert
      await Alert.create({
        hospital_id: item.hospital_id,
        type: 'Stock-Out',
        severity: 'Critical',
        message: `${item.medicine_name} is now completely out of stock!`,
        metadata: { medicine_name: item.medicine_name, inventory_id: item._id }
      });
    } else if (item.current_stock > 0 && prevStock === 0) {
      item.zero_stock_since = null;
      // Resolve stock-out alerts
      await Alert.updateMany(
        { hospital_id: item.hospital_id, type: 'Stock-Out', is_resolved: false, 'metadata.medicine_name': item.medicine_name },
        { is_resolved: true, resolved_at: new Date() }
      );
    }

    // Log usage
    const usedQty = prevStock - item.current_stock;
    if (usedQty > 0) {
      item.usage_log.push({ date: new Date(), quantity_used: usedQty });
      if (item.usage_log.length > 90) item.usage_log = item.usage_log.slice(-90);
    }

    await item.save();

    const io = req.app.get('io');
    io.to(`hospital_${item.hospital_id}`).emit('inventory_updated', item);
    io.to('admin_room').emit('inventory_updated', item);

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', protect, inventoryAllowed, async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inventory item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/inventory/:id/restock — restock a medicine
router.post('/:id/restock', protect, inventoryAllowed, async (req, res) => {
  try {
    const { quantity, batch_number, expiry_date } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.current_stock += quantity;
    if (batch_number) item.batch_number = batch_number;
    if (expiry_date) item.expiry_date = expiry_date;
    item.last_restocked = new Date();
    if (item.current_stock > 0) item.zero_stock_since = null;

    await item.save();

    const io = req.app.get('io');
    io.to(`hospital_${item.hospital_id}`).emit('inventory_updated', item);
    io.to('admin_room').emit('inventory_updated', item);

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/inventory/:id/request — raise restock indent
router.post('/:id/request', protect, inventoryAllowed, async (req, res) => {
  try {
    const { quantity_requested, notes } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const alert = await Alert.create({
      hospital_id: item.hospital_id,
      type: 'Restock-Request',
      severity: 'Medium',
      message: `Restock Indent: ${item.medicine_name} (${quantity_requested} ${item.unit}) requested. ${notes || ''}`,
      metadata: { medicine_name: item.medicine_name, inventory_id: item._id, quantity_requested }
    });

    const io = req.app.get('io');
    io.to('admin_room').emit('new_alert', alert);

    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/inventory/:hospitalId/usage-logs
router.get('/:hospitalId/usage-logs', protect, inventoryAllowed, async (req, res) => {
  try {
    const logs = await StockUsage.find({ hospital_id: req.params.hospitalId })
      .sort({ usage_date: -1 })
      .populate('recorded_by', 'name role')
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/inventory/:id/log-usage — explicitly log stock out
router.post('/:id/log-usage', protect, inventoryAllowed, async (req, res) => {
  try {
    const { quantity_used, used_for, prescribed_by } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.current_stock < quantity_used) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Update inventory
    item.current_stock -= quantity_used;
    item.usage_log.push({ date: new Date(), quantity_used });
    if (item.usage_log.length > 90) item.usage_log = item.usage_log.slice(-90);
    
    if (item.current_stock === 0) {
      item.zero_stock_since = new Date();
      await Alert.create({
        hospital_id: item.hospital_id,
        type: 'Stock-Out',
        severity: 'Critical',
        message: `${item.medicine_name} is now completely out of stock!`,
        metadata: { medicine_name: item.medicine_name, inventory_id: item._id }
      });
    }

    await item.save();

    // Create detailed log entry
    const usageRecord = await StockUsage.create({
      hospital_id: item.hospital_id,
      inventory_id: item._id,
      medicine_name: item.medicine_name,
      quantity_used,
      used_for,
      prescribed_by: prescribed_by || '',
      recorded_by: req.user.id
    });

    const io = req.app.get('io');
    io.to(`hospital_${item.hospital_id}`).emit('inventory_updated', item);
    io.to('admin_room').emit('inventory_updated', item);

    res.status(201).json({ item, usageRecord });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/inventory/ai-stock-check/:hospitalId
router.post('/ai-stock-check/:hospitalId', protect, inventoryAllowed, async (req, res) => {
  try {
    const items = await Inventory.find({ hospital_id: req.params.hospitalId });
    let requestsGenerated = 0;

    for (const item of items) {
      if (item.current_stock < 100) {
        // Check if a Restock-Request already exists for this medicine at this hospital
        const existingAlert = await Alert.findOne({
          hospital_id: item.hospital_id,
          type: 'Restock-Request',
          is_resolved: false,
          'metadata.inventory_id': item._id
        });

        if (!existingAlert) {
          // Automatically create a restock request for 500 units
          const alert = await Alert.create({
            hospital_id: item.hospital_id,
            type: 'Restock-Request',
            severity: 'High',
            message: `🤖 AI Manual Scan: ${item.medicine_name} stock is low (${item.current_stock} left). Automated request for 500 ${item.unit || 'units'} raised.`,
            metadata: {
              medicine_name: item.medicine_name,
              inventory_id: item._id,
              quantity_requested: 500,
              auto_generated_by_ai: true
            }
          });
          requestsGenerated++;

          const io = req.app.get('io');
          if (io) {
            io.to('admin_room').emit('new_alert', alert);
            io.to(`hospital_${item.hospital_id}`).emit('new_alert', alert);
          }
        }
      }
    }

    res.json({ message: 'AI Stock Check completed', requestsGenerated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
