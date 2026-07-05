const mongoose = require('mongoose');

const TransferSchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  from_hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  to_hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  initiated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'In-Transit', 'Received'], default: 'Pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transfer', TransferSchema);
