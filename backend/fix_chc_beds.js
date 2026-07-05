const mongoose = require('mongoose');
require('dotenv').config();
const Hospital = require('./models/Hospital');
const Bed = require('./models/Bed');

async function fixCHCBeds() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  
  const chcs = await Hospital.find({ type: 'CHC' });
  for (const chc of chcs) {
    const beds = await Bed.find({ hospital_id: chc._id });
    console.log(`Found ${beds.length} beds for ${chc.name}`);
    
    // Divide beds into Emergency, ICU, Trauma, NICU, General
    for (let i = 0; i < beds.length; i++) {
      if (i < 5) beds[i].ward = 'Emergency';
      else if (i < 15) beds[i].ward = 'ICU';
      else if (i < 20) beds[i].ward = 'Trauma';
      else if (i < 25) beds[i].ward = 'NICU';
      else beds[i].ward = 'General';
      
      bed_num = i + 1;
      beds[i].bed_number = `${beds[i].ward.substring(0,3).toUpperCase()}-${String(bed_num).padStart(2,'0')}`;
      await beds[i].save();
    }
  }
  console.log('Done updating CHC beds');
  process.exit(0);
}
fixCHCBeds();
