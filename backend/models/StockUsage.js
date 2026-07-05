const mongoose = require('mongoose');

const StockUsageSchema = new mongoose.Schema({
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  inventory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  medicine_name: { type: String, required: true },
  quantity_used: { type: Number, required: true },
  usage_date: { type: Date, default: Date.now },
  used_for: { type: String, required: true }, // e.g., "Patient John Doe", "General Ward"
  prescribed_by: { type: String, default: '' }, // e.g., "Dr. Smith"
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

StockUsageSchema.index({ hospital_id: 1, usage_date: -1 });
StockUsageSchema.index({ inventory_id: 1 });

module.exports = mongoose.model('StockUsage', StockUsageSchema);
