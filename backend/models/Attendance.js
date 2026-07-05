const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  date: { type: Date, required: true }, // Store the date (midnight of that day)
  status: { type: String, enum: ['Present', 'Absent', 'Leave', 'Half-Day'], required: true },
  notes: { type: String, default: '' },
  marked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure a doctor has only one attendance record per day
AttendanceSchema.index({ doctor_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
