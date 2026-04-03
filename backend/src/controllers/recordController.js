const { validationResult } = require('express-validator');
const Record = require('../models/Record');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');

// Create a new record
exports.create = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', details: errors.array() });
  }

  const payload = { ...req.body, owner: req.user.id };
  const record = await Record.create(payload);
  return res.status(201).json({ message: 'Record created', record });
});

// Get list with filters + pagination
exports.list = asyncHandler(async (req, res) => {
  const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;
  const filter = { isDeleted: false };

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  // Non-admins only see their own records
  if (req.user.role !== ROLES.ADMIN) {
    filter.owner = req.user.id;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    Record.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Record.countDocuments(filter),
  ]);

  return res.json({
    page: Number(page),
    pageSize: Number(limit),
    total,
    records,
  });
});

exports.getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const record = await Record.findById(id);
  if (!record || record.isDeleted) return res.status(404).json({ message: 'Record not found' });

  if (req.user.role !== ROLES.ADMIN && record.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: 'You cannot view this record' });
  }

  return res.json(record);
});

exports.update = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', details: errors.array() });
  }

  const { id } = req.params;
  const record = await Record.findById(id);
  if (!record || record.isDeleted) return res.status(404).json({ message: 'Record not found' });

  if (req.user.role !== ROLES.ADMIN && record.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: 'You cannot edit this record' });
  }

  Object.assign(record, req.body);
  await record.save();

  return res.json({ message: 'Record updated', record });
});

exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const record = await Record.findById(id);
  if (!record || record.isDeleted) return res.status(404).json({ message: 'Record not found' });

  if (req.user.role !== ROLES.ADMIN && record.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: 'You cannot delete this record' });
  }

  record.isDeleted = true;
  await record.save();

  return res.json({ message: 'Record deleted (soft)' });
});