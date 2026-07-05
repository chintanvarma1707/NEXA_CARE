const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  patient_name: { type: String, required: true },
  patient_age: { type: Number, required: true },
  patient_gender: { type: String, required: true },
  reason: { type: String, required: true },
  urgency: { type: String, enum: ['Routine', 'Urgent', 'Emergency'], default: 'Urgent' },
  from_hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  to_hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  referred_by: { type: String },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Referral', ReferralSchema);
