require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const h = await Hospital.find();
  console.log(h.map(x => ({ name: x.name, type: x.type })));
  process.exit(0);
}
check();
