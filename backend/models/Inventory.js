const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  medicine_name: { type: String, required: true, trim: true },
  medicine_name_native: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Antibiotic', 'Analgesic', 'Antiviral', 'Antimalarial', 'Vaccine', 'ORS', 'Vitamin', 'Antifungal', 'Other'],
    default: 'Other'
  },
  batch_number: { type: String, default: '' },
  current_stock: { type: Number, required: true, min: 0, default: 0 },
  unit: { type: String, enum: ['strips', 'bottles', 'vials', 'tablets', 'sachets', 'injections', 'units'], default: 'strips' },
  minimum_threshold: { type: Number, required: true, default: 10 },
  expiry_date: { type: Date, default: null },
  last_restocked: { type: Date, default: Date.now },
  supplier: { type: String, default: '' },
  // Historical daily usage log for AI forecasting
  usage_log: [{
    date: { type: Date },
    quantity_used: { type: Number, default: 0 }
  }],
  is_critical: { type: Boolean, default: false },
  zero_stock_since: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: stock status
InventorySchema.virtual('stock_status').get(function() {
  if (this.current_stock === 0) return 'Critical';
  if (this.current_stock <= this.minimum_threshold) return 'Low';
  if (this.current_stock <= this.minimum_threshold * 2) return 'Medium';
  return 'Good';
});

// Virtual: days until expiry
InventorySchema.virtual('days_to_expiry').get(function() {
  if (!this.expiry_date) return null;
  const diff = new Date(this.expiry_date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

InventorySchema.index({ hospital_id: 1, medicine_name: 1 });
InventorySchema.index({ current_stock: 1, minimum_threshold: 1 });

module.exports = mongoose.model('Inventory', InventorySchema);
