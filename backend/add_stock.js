require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');
const Hospital = require('./models/Hospital');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const phc = await Hospital.findOne({ name: 'PHC Hadapsar' });
  if (!phc) return console.log('Hospital not found');
  
  await Inventory.findOneAndUpdate(
    { hospital_id: phc._id, medicine_name: 'Chloroquine 250mg' },
    { category: 'Other', current_stock: 500, minimum_threshold: 100 },
    { upsert: true, new: true }
  );
  console.log('Stock added successfully');
  process.exit(0);
}
run();
