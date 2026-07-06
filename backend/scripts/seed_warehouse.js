require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const Inventory = require('../models/Inventory');

const COMMON_MEDICINES = [
  { name: 'Paracetamol 500mg', category: 'Analgesic', unit: 'strips', min: 10000 },
  { name: 'Amoxicillin 250mg', category: 'Antibiotic', unit: 'strips', min: 5000 },
  { name: 'Ibuprofen 400mg', category: 'Analgesic', unit: 'strips', min: 8000 },
  { name: 'Vitamin A Syrup', category: 'Vitamin', unit: 'bottles', min: 2000 },
  { name: 'ORS Packets', category: 'ORS', unit: 'sachets', min: 15000 },
  { name: 'Ciprofloxacin 500mg', category: 'Antibiotic', unit: 'strips', min: 4000 },
  { name: 'Metronidazole 400mg', category: 'Antibiotic', unit: 'strips', min: 4000 },
  { name: 'Diclofenac Gel', category: 'Analgesic', unit: 'units', min: 1000 },
  { name: 'Azithromycin 500mg', category: 'Antibiotic', unit: 'strips', min: 3000 },
  { name: 'Fluconazole 150mg', category: 'Antifungal', unit: 'strips', min: 2000 },
  { name: 'Ceftriaxone Injection', category: 'Antibiotic', unit: 'vials', min: 500 },
  { name: 'Rabies Vaccine', category: 'Vaccine', unit: 'vials', min: 300 },
  { name: 'BCG Vaccine', category: 'Vaccine', unit: 'vials', min: 200 }
];

async function seedWarehouse() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let warehouse = await Hospital.findOne({ type: 'Warehouse' });

    if (!warehouse) {
      console.log('Creating District Warehouse...');
      warehouse = new Hospital({
        name: 'District Central Warehouse',
        code: 'WH-DISTRICT',
        type: 'Warehouse',
        district: 'Pune',
        state: 'Maharashtra',
        location: {
          address: 'Central District Depot, Pune',
          lat: 18.5204,
          lng: 73.8567
        },
        contact_phone: '020-11112222',
        total_beds: 0,
        is_active: true
      });
      await warehouse.save();
      console.log('Warehouse created:', warehouse._id);
    } else {
      console.log('Warehouse already exists:', warehouse._id);
    }

    console.log('Populating Warehouse Inventory...');
    for (const med of COMMON_MEDICINES) {
      let inv = await Inventory.findOne({ hospital_id: warehouse._id, medicine_name: med.name });
      
      const hugeStock = Math.floor(Math.random() * 50000) + 150000; // Between 150,000 and 200,000
      
      if (!inv) {
        inv = new Inventory({
          hospital_id: warehouse._id,
          medicine_name: med.name,
          category: med.category,
          unit: med.unit,
          minimum_threshold: med.min,
          current_stock: hugeStock,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
        });
        await inv.save();
        console.log(`Added new stock: ${med.name} - ${hugeStock} ${med.unit}`);
      } else {
        inv.current_stock = hugeStock;
        await inv.save();
        console.log(`Updated stock: ${med.name} - ${hugeStock} ${med.unit}`);
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding warehouse:', error);
    process.exit(1);
  }
}

seedWarehouse();
