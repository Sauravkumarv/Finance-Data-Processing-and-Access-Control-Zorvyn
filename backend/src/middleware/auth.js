const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Validate JWT and attach fresh user data
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Authorization header missing or malformed' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // pull current role/status
    const user = await User.findById(decoded.id).select('role status name email');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.status === 'inactive') return res.status(403).json({ message: 'User is inactive' });

    req.user = { id: user._id.toString(), role: user.role, status: user.status, name: user.name, email: user.email };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
