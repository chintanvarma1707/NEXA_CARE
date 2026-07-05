require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const bedRoutes = require('./routes/beds');
const patientRoutes = require('./routes/patients');
const inventoryRoutes = require('./routes/inventory');
const alertRoutes = require('./routes/alerts');
const dashboardRoutes = require('./routes/dashboard');
const doctorRoutes = require('./routes/doctors');
const { runUnderperformanceCheck } = require('./jobs/cronJobs');

const app = express();
const server = http.createServer(app);

// Socket.IO — real-time PHC ↔ Admin sync
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
});

app.set('io', io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nexacaredb';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected — nexacaredb'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/logistics', require('./routes/logistics'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Nexa Care API',
    tagline: 'SmartHealth Ecosystem for PHCs & District Admin',
    version: '1.0.0',
    status: '🟢 Operational',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET  /api/hospitals',
      'GET  /api/beds/:hospitalId',
      'GET  /api/patients/:hospitalId',
      'GET  /api/inventory/:hospitalId',
      'GET  /api/alerts',
      'GET  /api/dashboard/admin',
      'GET  /api/dashboard/phc/:hospitalId'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('📡 Socket connected:', socket.id);
  socket.on('join_hospital', (hId) => socket.join(`hospital_${hId}`));
  socket.on('join_admin', () => socket.join('admin_room'));
  socket.on('disconnect', () => console.log('📴 Socket left:', socket.id));
});

// Cron — underperformance check every hour
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Cron: Underperformance check...');
  await runUnderperformanceCheck(io);
});

// Run once after boot
setTimeout(() => runUnderperformanceCheck(io), 8000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Nexa Care Backend running at http://localhost:${PORT}`);
  console.log(`📊 WebSocket ready for real-time sync\n`);
});
