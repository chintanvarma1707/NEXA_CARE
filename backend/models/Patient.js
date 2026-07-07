const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  patient_id: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  name_native: { type: String, default: '' },
  age: { type: Number, required: true, min: 0, max: 150 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  diagnosis: { type: String, required: true, trim: true },
  symptoms: { type: String, default: '' },
  admitted_date: { type: Date, default: Date.now },
  discharged_date: { type: Date, default: null },
  assigned_bed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', default: null },
  status: { type: String, enum: ['Admitted', 'Discharged', 'Transferred', 'Critical'], default: 'Admitted' },
  blood_group: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'], default: 'Unknown' },
  attending_doctor: { type: String, default: '' },
  notes: { type: String, default: '' },
  is_referred: { type: Boolean, default: false },
  referred_to: { type: String, default: '' },
  referral_reason: { type: String, default: '' }
}, { timestamps: true });

PatientSchema.pre('save', async function(next) {
  if (!this.patient_id) {
    const count = await mongoose.model('Patient').countDocuments();
    const year = new Date().getFullYear();
    this.patient_id = `NC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

PatientSchema.index({ hospital_id: 1, status: 1 });

module.exports = mongoose.model('Patient', PatientSchema);
