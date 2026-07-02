const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'nexacare_ultra_secure_secret_2024';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied. Requires: ${roles.join(' or ')}` });
  }
  next();
};

const adminOnly = requireRole('District_Admin');
const phcOrAdmin = requireRole('PHC_Manager', 'District_Admin', 'Receptionist', 'Inventory_Manager', 'Doctor');
const receptionistAllowed = requireRole('PHC_Manager', 'District_Admin', 'Receptionist', 'Doctor', 'Inventory_Manager');
const inventoryAllowed = requireRole('PHC_Manager', 'District_Admin', 'Inventory_Manager');

module.exports = { protect, requireRole, adminOnly, phcOrAdmin, receptionistAllowed, inventoryAllowed, SECRET_KEY };
