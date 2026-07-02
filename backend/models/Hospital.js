const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['PHC', 'CHC', 'District Hospital', 'Sub-Centre'], default: 'PHC' },
  district: { type: String, required: true },
  state: { type: String, default: 'Maharashtra' },
  location: {
    address: { type: String, default: '' },
    village: { type: String, default: '' },
    tehsil: { type: String, default: '' },
    pincode: { type: String, default: '' },
    lat: { type: Number, default: 18.5204 },
    lng: { type: Number, default: 73.8567 }
  },
  total_beds: { type: Number, required: true, min: 1 },
  contact_phone: { type: String, default: '' },
  doctor_count: { type: Number, default: 0 },
  nurse_count: { type: Number, default: 0 },
  attendance_log: [{
    date: { type: Date },
    doctors_present: { type: Number, default: 0 },
    doctors_total: { type: Number, default: 0 }
  }],
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

HospitalSchema.virtual('recent_attendance_rate').get(function() {
  if (!this.attendance_log || this.attendance_log.length === 0) return 100;
  const recent = this.attendance_log.slice(-3);
  const total = recent.reduce((s, d) => s + (d.doctors_total || 0), 0);
  const present = recent.reduce((s, d) => s + (d.doctors_present || 0), 0);
  return total === 0 ? 100 : Math.round((present / total) * 100);
});

module.exports = mongoose.model('Hospital', HospitalSchema);
