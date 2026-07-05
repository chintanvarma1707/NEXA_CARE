require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixPwd() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'chc@nexacare.gov.in' });
  if (user) {
    user.password_hash = 'CHC@123';
    await user.save();
    console.log('Fixed CHC password');
  }
  process.exit(0);
}
fixPwd();
