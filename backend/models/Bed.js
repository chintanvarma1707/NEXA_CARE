const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  bed_number: { type: String, required: true, trim: true },
  ward: { type: String, enum: ['General', 'Deluxe', 'Super Deluxe', 'ICU', 'Maternity', 'Pediatric', 'Emergency', 'Surgical'], default: 'General' },
  status: { type: String, enum: ['Available', 'Occupied', 'Maintenance', 'Reserved'], default: 'Available' },
  current_patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  last_sanitized: { type: Date, default: null }
}, { timestamps: true });

BedSchema.index({ hospital_id: 1, status: 1 });
BedSchema.index({ hospital_id: 1, bed_number: 1 }, { unique: true });

module.exports = mongoose.model('Bed', BedSchema);
