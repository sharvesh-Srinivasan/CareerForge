const express = require('express');
const router = express.Router();
const { getResumes, uploadResume, deleteResume } = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

router.get('/', getResumes);

// Multer error handler must be a named 4-parameter middleware
router.post('/', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message, data: null });
    }
    next();
  });
}, uploadResume);

router.delete('/:id', deleteResume);

module.exports = router;
