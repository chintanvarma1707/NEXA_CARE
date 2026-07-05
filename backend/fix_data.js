const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const Hospital = require('./models/Hospital');
const Bed = require('./models/Bed');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');

async function fixData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const hospitals = await Hospital.find();
    
    for (const hospital of hospitals) {
      console.log(`Processing hospital: ${hospital.name}`);
      
      // 1. Get available doctors for this hospital
      const doctors = await Doctor.find({ hospital_id: hospital._id, today_status: 'Present' });
      const doctorNames = doctors.map(d => d.name);
      
      if (doctorNames.length === 0) {
        console.log(`  No present doctors found for ${hospital.name}. Skipping doctor reassignment.`);
      } else {
        console.log(`  Found present doctors: ${doctorNames.join(', ')}`);
      }

      // 2. Fix red beds that have no patient
      const badBeds = await Bed.find({ hospital_id: hospital._id, status: 'Occupied', current_patient_id: null });
      console.log(`  Found ${badBeds.length} corrupted 'Occupied' beds without patients.`);
      
      for (let i = 0; i < badBeds.length; i++) {
        const bed = badBeds[i];
        const randomDoc = doctorNames.length > 0 ? doctorNames[Math.floor(Math.random() * doctorNames.length)] : '';
        
        // Create a fake patient
        const newPatient = new Patient({
          hospital_id: hospital._id,
          name: `Patient ${Math.floor(Math.random() * 1000)}`,
          age: Math.floor(Math.random() * 60) + 10,
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          diagnosis: 'General Checkup',
          symptoms: 'Mild pain',
          blood_group: 'O+',
          attending_doctor: randomDoc,
          assigned_bed_id: bed._id,
          status: 'Admitted'
        });
        
        await newPatient.save();
        
        // Link bed to patient
        bed.current_patient_id = newPatient._id;
        await bed.save();
        console.log(`    Fixed bed ${bed.bed_number} by adding ${newPatient.name}`);
      }

      // 3. Reassign doctors for all admitted patients
      if (doctorNames.length > 0) {
        const allAdmitted = await Patient.find({ hospital_id: hospital._id, status: 'Admitted' });
        for (const p of allAdmitted) {
          // If attending doctor is Mehta or not in the present list, reassign
          if (!p.attending_doctor || p.attending_doctor.includes('Mehta') || !doctorNames.includes(p.attending_doctor)) {
            const newDoc = doctorNames[Math.floor(Math.random() * doctorNames.length)];
            p.attending_doctor = newDoc;
            await p.save();
          }
        }
        console.log(`  Reassigned doctors for ${allAdmitted.length} patients.`);
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixData();
