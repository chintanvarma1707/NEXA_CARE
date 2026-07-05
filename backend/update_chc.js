const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

async function updateCHC() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const chcUser = await User.findOne({ email: 'phc2@nexacare.gov.in' });
  if (chcUser) {
    chcUser.email = 'chc@nexacare.gov.in';
    const salt = await bcrypt.genSalt(10);
    chcUser.password_hash = await bcrypt.hash('CHC@123', salt);
    await chcUser.save();
    console.log('Updated CHC User credentials');
  } else {
    console.log('User not found');
  }
  process.exit(0);
}
updateCHC();
