const { validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');

// List users with simple filtering
exports.list = asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  return res.json({ count: users.length, users });
});

// Update role or status
exports.update = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', details: errors.array() });
  }

  const { id } = req.params;
  const { role, status } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (role) user.role = role;
  if (status) user.status = status;

  await user.save();

  return res.json({ message: 'User updated', user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
});

// Soft deactivate user
exports.deactivate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.role === ROLES.ADMIN) {
    return res.status(400).json({ message: 'Cannot deactivate another admin through this endpoint' });
  }

  user.status = 'inactive';
  await user.save();

  return res.json({ message: 'User deactivated' });
});