const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

exports.register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', details: errors.array() });
  }

  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'User already exists with that email' });
  }

  const userCount = await User.countDocuments();

  // First ever user is promoted to admin to let the system bootstrap itself.
  let resolvedRole = userCount === 0 ? ROLES.ADMIN : ROLES.VIEWER;

  // Allow admins to set a role explicitly.
  if (req.user && req.user.role === ROLES.ADMIN && role) {
    resolvedRole = role;
  }

  const user = await User.create({ name, email, password, role: resolvedRole });

  return res.status(201).json({
    message: 'User created',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', details: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'User Not Registered' });
  if (user.status === 'inactive') return res.status(403).json({ message: 'User is inactive' });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Password Wrong' });

  const token = generateToken(user);
  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});