const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  type: {
    type: String,
    enum: ['Stock-Out', 'Low-Stock', 'Underperformance', 'Bed-Full', 'Expiry-Warning', 'AI-Forecast', 'Restock-Request', 'Restock-Approved'],
    required: true
  },
  severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  message: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_resolved: { type: Boolean, default: false },
  resolved_at: { type: Date, default: null },
  resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

AlertSchema.index({ hospital_id: 1, is_resolved: 1 });
AlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', AlertSchema);
