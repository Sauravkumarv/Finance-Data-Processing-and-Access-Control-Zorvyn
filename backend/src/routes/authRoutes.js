const express = require('express');
const { body } = require('express-validator');
const optionalAuth = require('../middleware/optionalAuth');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Registration (bootstrap first admin automatically)
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password min length is 6'),
    body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
  ],
  optionalAuth,
  register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  login
);

module.exports = router;