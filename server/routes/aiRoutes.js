const express = require('express');
const router = express.Router();
const { extractDetails } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

// Route is protected so only logged-in users can use AI extraction
router.post('/extract', authMiddleware, extractDetails);

module.exports = router;
