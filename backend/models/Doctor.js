const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  contact_number: { type: String, default: '' },
  email: { type: String, default: '' },
  availability_start: { type: String, default: '09:00' }, // 24-hour format HH:mm
  availability_end: { type: String, default: '17:00' },
  lunch_start: { type: String, default: '13:00' },
  lunch_end: { type: String, default: '14:00' },
  working_days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
