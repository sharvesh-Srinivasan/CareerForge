const express = require('express');
const router = express.Router();
const { getInterviewRounds, addRound, updateRound, deleteRound } = require('../controllers/interviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/:applicationId', getInterviewRounds);
router.post('/:applicationId', addRound);
router.patch('/round/:roundId', updateRound);
router.delete('/round/:roundId', deleteRound);

module.exports = router;
