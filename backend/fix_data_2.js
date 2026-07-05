const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Hospital = require('./models/Hospital');
const Bed = require('./models/Bed');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');

async function fixData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Remove Dr. Mehta from the system completely
    const deletedMehtas = await Doctor.deleteMany({ name: { $regex: /Mehta/i } });
    console.log(`Deleted ${deletedMehtas.deletedCount} doctors named Mehta.`);

    const hospitals = await Hospital.find();
    
    for (const hospital of hospitals) {
      console.log(`Processing hospital: ${hospital.name}`);
      
      // Get ALL doctors for this hospital
      const doctors = await Doctor.find({ hospital_id: hospital._id });
      const doctorNames = doctors.map(d => d.name);
      
      if (doctorNames.length === 0) {
        console.log(`  No doctors found for ${hospital.name}.`);
        continue;
      }

      console.log(`  Found doctors: ${doctorNames.join(', ')}`);

      // Reassign doctors for ALL patients who have Mehta or no valid doctor
      const allAdmitted = await Patient.find({ hospital_id: hospital._id, status: 'Admitted' });
      let reassignedCount = 0;
      for (const p of allAdmitted) {
        if (!p.attending_doctor || p.attending_doctor.toLowerCase().includes('mehta') || !doctorNames.includes(p.attending_doctor)) {
          const newDoc = doctorNames[Math.floor(Math.random() * doctorNames.length)];
          p.attending_doctor = newDoc;
          await p.save();
          reassignedCount++;
        }
      }
      console.log(`  Reassigned doctors for ${reassignedCount} patients.`);
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixData();
