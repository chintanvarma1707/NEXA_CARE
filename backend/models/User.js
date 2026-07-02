const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['PHC_Manager', 'District_Admin', 'Receptionist', 'Inventory_Manager', 'Doctor'], default: 'PHC_Manager' },
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
  district: { type: String, default: 'Pune' },
  phone: { type: String, default: '' },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 10);
  next();
});

UserSchema.methods.comparePassword = function(pwd) {
  return bcrypt.compare(pwd, this.password_hash);
};

UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
