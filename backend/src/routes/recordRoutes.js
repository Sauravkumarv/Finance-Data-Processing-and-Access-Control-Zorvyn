const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { create, list, getOne, update, remove } = require('../controllers/recordController');

const router = express.Router();

router.use(auth);

router.post(
  '/',
  requireRole('analyst', 'admin'),
  [
    body('amount').isNumeric().withMessage('Amount is required'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').optional().isISO8601().toDate(),
    body('notes').optional().isString(),
  ],
  create
);

router.get('/', list);
router.get('/:id', getOne);

router.patch(
  '/:id',
  requireRole('analyst', 'admin'),
  [
    body('amount').optional().isNumeric(),
    body('type').optional().isIn(['income', 'expense']),
    body('category').optional().isString(),
    body('date').optional().isISO8601().toDate(),
    body('notes').optional().isString(),
  ],
  update
);

router.delete('/:id', requireRole('analyst', 'admin'), remove);

module.exports = router;