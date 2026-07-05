require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function verify() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'chc@nexacare.gov.in' });
  if (user) {
    console.log('User found:', user.email);
    console.log('Role:', user.role);
    const isMatch = await user.comparePassword('CHC@123');
    console.log('Password match:', isMatch);
  } else {
    console.log('User not found');
  }
  process.exit(0);
}
verify();
