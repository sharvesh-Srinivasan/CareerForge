const express = require('express');
const router = express.Router();
const { getReminders, createReminder, updateReminder, deleteReminder } = require('../controllers/reminderController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getReminders);
router.post('/', createReminder);
router.patch('/:id', updateReminder);
router.delete('/:id', deleteReminder);

module.exports = router;
