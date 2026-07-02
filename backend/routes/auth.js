const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { SECRET_KEY } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, hospital_id, district, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({
      name, email, password_hash: password,
      role: role || 'PHC_Manager',
      hospital_id: hospital_id || null,
      district: district || '',
      phone: phone || ''
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, hospital_id: user.hospital_id },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).populate('hospital_id', 'name district type');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.is_active) return res.status(403).json({ message: 'Account deactivated' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, hospital_id: user.hospital_id?._id || user.hospital_id },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
const { protect } = require('../middleware/auth');
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('hospital_id', 'name district type total_beds');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET /api/auth/doctors/:hospitalId
router.get('/doctors/:hospitalId', protect, async (req, res) => {
  try {
    const doctors = await User.find({ hospital_id: req.params.hospitalId, role: 'Doctor', is_active: true }).select('name email');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
