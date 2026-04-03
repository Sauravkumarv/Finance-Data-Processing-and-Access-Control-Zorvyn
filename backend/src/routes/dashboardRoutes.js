const express = require('express');
const auth = require('../middleware/auth');
const { getSummary } = require('../controllers/dashboardController');

const router = express.Router();

router.use(auth);
router.get('/summary', getSummary);

module.exports = router;