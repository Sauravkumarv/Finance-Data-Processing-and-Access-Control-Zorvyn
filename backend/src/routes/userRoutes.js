const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { list, update, deactivate } = require('../controllers/userController');

const router = express.Router();

router.use(auth, requireRole('admin'));

router.get('/', list);

router.patch(
  '/:id',
  [
    body('role').optional().isIn(['viewer', 'analyst', 'admin']),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  update
);

router.post('/:id/deactivate', deactivate);

module.exports = router;