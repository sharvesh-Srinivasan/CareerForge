const express = require('express');
const router = express.Router();
const {
  getApplications,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
  getStats,
  getActivity,
} = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Important: specific routes must come before /:id
router.get('/stats', getStats);
router.get('/activity', getActivity);

router.get('/', getApplications);
router.post('/', createApplication);
router.get('/:id', getApplication);
router.patch('/:id', updateApplication);
router.delete('/:id', deleteApplication);

module.exports = router;
