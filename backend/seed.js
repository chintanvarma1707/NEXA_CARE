require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Bed = require('./models/Bed');
const Patient = require('./models/Patient');
const Inventory = require('./models/Inventory');
const Alert = require('./models/Alert');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nexacaredb';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB for seeding...\n');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Hospital.deleteMany({}), Bed.deleteMany({}),
    Patient.deleteMany({}), Inventory.deleteMany({}), Alert.deleteMany({})
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── HOSPITALS ───────────────────────────────────────────────────────────
  const hospitals = await Hospital.insertMany([
    {
      name: 'Dholka PHC', code: 'PHC-DLK', type: 'PHC', district: 'Ahmedabad', state: 'Gujarat',
      location: { address: 'Dholka, Ahmedabad', village: 'Dholka', tehsil: 'Dholka', pincode: '382225', lat: 22.7276, lng: 72.4646 },
      total_beds: 20, contact_phone: '079-26876543', doctor_count: 4, nurse_count: 8,
      attendance_log: [
        { date: new Date(Date.now() - 2*86400000), doctors_present: 1, doctors_total: 4 },
        { date: new Date(Date.now() - 1*86400000), doctors_present: 1, doctors_total: 4 },
        { date: new Date(), doctors_present: 2, doctors_total: 4 }
      ]
    },
    {
      name: 'Ahmedabad CHC', code: 'CHC-AHD', type: 'CHC', district: 'Ahmedabad', state: 'Gujarat',
      location: { address: 'Ahmedabad City', village: 'Ahmedabad', tehsil: 'Ahmedabad', pincode: '380001', lat: 23.0225, lng: 72.5714 },
      total_beds: 30, contact_phone: '079-22234567', doctor_count: 6, nurse_count: 12,
      attendance_log: [
        { date: new Date(Date.now() - 2*86400000), doctors_present: 5, doctors_total: 6 },
        { date: new Date(Date.now() - 1*86400000), doctors_present: 6, doctors_total: 6 },
        { date: new Date(), doctors_present: 5, doctors_total: 6 }
      ]
    },
    {
      name: 'Viramgam PHC', code: 'PHC-VRM', type: 'PHC', district: 'Ahmedabad', state: 'Gujarat',
      location: { address: 'Viramgam, Ahmedabad', village: 'Viramgam', tehsil: 'Viramgam', pincode: '382150', lat: 23.1189, lng: 72.0463 },
      total_beds: 15, contact_phone: '02715-244001', doctor_count: 3, nurse_count: 6,
      attendance_log: [
        { date: new Date(Date.now() - 2*86400000), doctors_present: 3, doctors_total: 3 },
        { date: new Date(Date.now() - 1*86400000), doctors_present: 3, doctors_total: 3 },
        { date: new Date(), doctors_present: 2, doctors_total: 3 }
      ]
    },
    {
      name: 'District Central Warehouse', code: 'WH-AHD', type: 'Warehouse', district: 'Ahmedabad', state: 'Gujarat',
      location: { address: 'Ahmedabad Industrial Estate', village: 'Ahmedabad', tehsil: 'Ahmedabad', pincode: '380002', lat: 23.0300, lng: 72.5800 },
      total_beds: 0, contact_phone: '079-11111111', doctor_count: 0, nurse_count: 0,
      attendance_log: []
    }
  ]);
  console.log(`🏥 Created ${hospitals.length} hospitals (including warehouse)`);

  // ─── BEDS ────────────────────────────────────────────────────────────────
  const allBeds = [];
  for (const h of hospitals) {
    const wards = h.type === 'CHC' 
      ? ['Emergency', 'ICU', 'Trauma', 'NICU', 'General', 'Deluxe', 'Super Deluxe']
      : ['General', 'Deluxe', 'Super Deluxe'];
    let bedNum = 0;
    for (const ward of wards) {
      let count = 10; // Default 10 beds for CHC wards
      if (h.type === 'PHC') {
        if (ward === 'Super Deluxe') count = 10;
        else if (ward === 'Deluxe') count = 10;
        else if (ward === 'General') count = 20;
      }
      for (let i = 1; i <= count; i++) {
        bedNum++;
        allBeds.push({
          hospital_id: h._id,
          bed_number: `${ward.substring(0, 3).toUpperCase()}-${String(i).padStart(2,'0')}`,
          ward,
          status: Math.random() > 0.65 ? 'Occupied' : (Math.random() > 0.85 ? 'Maintenance' : 'Available')
        });
      }
    }
  }
  const beds = await Bed.insertMany(allBeds);
  console.log(`🛏️  Created ${beds.length} beds`);

  // ─── PATIENTS ────────────────────────────────────────────────────────────
  const diagnoses = ['Malaria','Typhoid','Dengue','Tuberculosis','Pneumonia','Diarrhea','Anemia','Hypertension'];
  const names = ['Rajesh Kumar','Priya Sharma','Anil Patil','Sunita Devi','Mohan Rao','Kavita Joshi','Ramesh Gupta','Anita Singh'];
  const occupiedBeds = beds.filter(b => b.status === 'Occupied');
  const patients = [];

  for (let i = 0; i < occupiedBeds.length; i++) {
    const bed = occupiedBeds[i];
    const patientName = `${names[i % names.length]} ${i + 1}`;
    const patient = new Patient({
      hospital_id: bed.hospital_id,
      name: patientName,
      age: 20 + Math.floor(Math.random() * 60),
      gender: i % 3 === 0 ? 'Female' : 'Male',
      diagnosis: diagnoses[i % diagnoses.length],
      admitted_date: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000),
      assigned_bed_id: bed._id,
      status: 'Admitted',
      blood_group: ['A+','B+','O+','AB+'][i % 4],
      attending_doctor: `Dr. ${['Mehta','Shah','Patel','Joshi'][i % 4]}`,
      address: 'Village Rd, Gujarat'
    });
    patients.push(patient);
  }

  const savedPatients = [];
  for (const p of patients) {
    const saved = await p.save();
    savedPatients.push(saved);
  }
  console.log(`👥 Created ${savedPatients.length} patients`);

  // Link patients to beds
  for (let i = 0; i < savedPatients.length; i++) {
    await Bed.findByIdAndUpdate(occupiedBeds[i]._id, { current_patient_id: savedPatients[i]._id });
  }

  // ─── INVENTORY ───────────────────────────────────────────────────────────
  const medicines = [
    { name: 'Paracetamol 500mg', cat: 'Analgesic', unit: 'strips' },
    { name: 'Amoxicillin 250mg', cat: 'Antibiotic', unit: 'strips' },
    { name: 'Chloroquine 250mg', cat: 'Antimalarial', unit: 'tablets' },
    { name: 'ORS Sachets', cat: 'ORS', unit: 'sachets' },
    { name: 'Metronidazole 400mg', cat: 'Antibiotic', unit: 'strips' },
    { name: 'Cotrimoxazole', cat: 'Antibiotic', unit: 'tablets' },
    { name: 'Iron + Folic Acid', cat: 'Vitamin', unit: 'strips' },
    { name: 'Vitamin A Capsules', cat: 'Vitamin', unit: 'bottles' },
    { name: 'Tetracycline Eye Oint', cat: 'Antibiotic', unit: 'units' },
    { name: 'Hepatitis B Vaccine', cat: 'Vaccine', unit: 'vials' }
  ];

  const inventoryItems = [];
  for (const h of hospitals) {
    if (h.type === 'Warehouse') {
      medicines.forEach((med) => {
        inventoryItems.push({
          hospital_id: h._id,
          medicine_name: med.name,
          category: med.cat,
          current_stock: 5000 + Math.floor(Math.random() * 5000),
          minimum_threshold: 1000,
          unit: med.unit,
          batch_number: `WH-${Date.now()}`,
          expiry_date: new Date(Date.now() + 365 * 86400000)
        });
      });
    } else {
      for (let m = 0; m < medicines.length; m++) {
        const med = medicines[m];
        const stock = m === 2 ? 0 : m === 4 ? 3 : 10 + Math.floor(Math.random() * 90);
        const threshold = 10;
        const usageLog = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000),
          quantity_used: Math.floor(Math.random() * 5) + 1
        }));

        inventoryItems.push({
          hospital_id: h._id,
          medicine_name: med.name,
          category: med.cat,
          batch_number: `BT-${Date.now()}-${m}`,
          current_stock: stock,
          unit: med.unit,
          minimum_threshold: threshold,
          expiry_date: new Date(Date.now() + (m === 9 ? 30 : 365) * 86400000),
          zero_stock_since: stock === 0 ? new Date(Date.now() - 72 * 60 * 60 * 1000) : null,
          usage_log: usageLog
        });
      }
    }
  }
  await Inventory.insertMany(inventoryItems);
  console.log(`💊 Created ${inventoryItems.length} inventory items`);

  // ─── ALERTS ──────────────────────────────────────────────────────────────
  await Alert.insertMany([
    {
      hospital_id: hospitals[0]._id,
      type: 'Stock-Out', severity: 'Critical', is_resolved: false,
      message: '🔴 Chloroquine 250mg has been out of stock for 72 hours at Dholka PHC. Urgent resupply needed.',
      metadata: { medicine_name: 'Chloroquine 250mg', hospital_name: 'Dholka PHC' }
    },
    {
      hospital_id: hospitals[0]._id,
      type: 'Underperformance', severity: 'High', is_resolved: false,
      message: '⚠️ Doctor attendance has been below 50% for 3 consecutive days at Dholka PHC.',
      metadata: { hospital_name: 'Dholka PHC' }
    },
    {
      hospital_id: hospitals[1]._id,
      type: 'Low-Stock', severity: 'Medium', is_resolved: false,
      message: '🟡 Metronidazole 400mg stock critically low at Ahmedabad CHC (3 strips remaining).',
      metadata: { medicine_name: 'Metronidazole 400mg', hospital_name: 'Ahmedabad CHC' }
    },
    {
      hospital_id: hospitals[2]._id,
      type: 'AI-Forecast', severity: 'Medium', is_resolved: false,
      message: '🤖 AI Prediction: ORS Sachets expected to run out in 4 days at Viramgam PHC based on current usage trends.',
      metadata: { medicine_name: 'ORS Sachets', days_remaining: 4, hospital_name: 'Viramgam PHC' }
    }
  ]);
  console.log(`🚨 Created seed alerts`);

  // ─── USERS ───────────────────────────────────────────────────────────────
  const users = [
    { name: 'District Admin', email: 'admin@nexacare.gov.in', password_hash: 'Admin@123', role: 'District_Admin', district: 'Ahmedabad' },
    { name: 'Dr. Ramesh Patil', email: 'phc1@nexacare.gov.in', password_hash: 'PHC@123', role: 'PHC_Manager', hospital_id: hospitals[0]._id, district: 'Ahmedabad' },
    { name: 'Receptionist Anjali', email: 'reception@nexacare.gov.in', password_hash: 'Rec@123', role: 'Receptionist', hospital_id: hospitals[0]._id, district: 'Ahmedabad' },
    { name: 'Inventory Manager Rohit', email: 'inventory@nexacare.gov.in', password_hash: 'Inv@123', role: 'Inventory_Manager', hospital_id: hospitals[0]._id, district: 'Ahmedabad' },
    { name: 'Dr. Mehta', email: 'mehta@nexacare.gov.in', password_hash: 'Doc@123', role: 'Doctor', hospital_id: hospitals[0]._id, district: 'Ahmedabad' },
    { name: 'Dr. Shah', email: 'shah@nexacare.gov.in', password_hash: 'Doc@123', role: 'Doctor', hospital_id: hospitals[0]._id, district: 'Ahmedabad' },
    { name: 'Dr. Sunita Joshi', email: 'chc@nexacare.gov.in', password_hash: 'CHC@123', role: 'PHC_Manager', hospital_id: hospitals[1]._id, district: 'Ahmedabad' },
    { name: 'Dr. Anil Shinde', email: 'phc3@nexacare.gov.in', password_hash: 'PHC@123', role: 'PHC_Manager', hospital_id: hospitals[2]._id, district: 'Ahmedabad' }
  ];

  for (const u of users) {
    const user = new User(u);
    await user.save();
  }
  console.log(`👤 Created ${users.length} users`);

  console.log('\n✅ ─── SEEDING COMPLETE ───');
  console.log('🔑 Demo Credentials:');
  console.log('   Admin:        admin@nexacare.gov.in / Admin@123');
  console.log('   PHC Manager:  phc1@nexacare.gov.in / PHC@123');
  console.log('   Receptionist: reception@nexacare.gov.in / Rec@123');
  console.log('   Inventory:    inventory@nexacare.gov.in / Inv@123');
  console.log('   Doctor:       mehta@nexacare.gov.in / Doc@123\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
