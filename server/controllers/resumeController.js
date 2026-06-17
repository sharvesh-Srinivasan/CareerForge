const db = require('../config/db');
const { cloudinary } = require('../middleware/uploadMiddleware');

const log = (level, msg) => console.log(`[${level}] [${new Date().toISOString()}] ${msg}`);

// ─── GET /api/resumes ─────────────────────────────────────────────────────────
const getResumes = async (req, res) => {
  try {
    const [resumes] = await db.query(
      `SELECT
        rv.id,
        rv.name,
        rv.version,
        rv.cloudinary_url,
        rv.cloudinary_public_id,
        rv.created_at,
        COUNT(DISTINCT a.id) AS application_count,
        COUNT(DISTINCT ir.id) AS interview_count,
        ROUND(
          CASE
            WHEN COUNT(DISTINCT a.id) = 0 THEN 0
            ELSE (COUNT(DISTINCT ir.id) / COUNT(DISTINCT a.id)) * 100
          END,
          1
        ) AS success_rate
       FROM resume_versions rv
       LEFT JOIN applications a ON a.resume_version_id = rv.id AND a.user_id = rv.user_id
       LEFT JOIN interview_rounds ir ON ir.application_id = a.id
       WHERE rv.user_id = ?
       GROUP BY rv.id
       ORDER BY rv.created_at DESC`,
      [req.user.id]
    );

    return res.json({ success: true, message: 'Resumes fetched.', data: resumes });
  } catch (err) {
    log('ERROR', `GetResumes error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch resumes.', data: null });
  }
};

// ─── POST /api/resumes ────────────────────────────────────────────────────────
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.', data: null });
    }

    const { name, version } = req.body;

    if (!name || !version) {
      // Delete the uploaded file from Cloudinary if validation fails
      if (req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' }).catch(() => {});
      }
      return res.status(400).json({ success: false, message: 'Resume name and version are required.', data: null });
    }

    const cloudinaryUrl = req.file.path;
    const cloudinaryPublicId = req.file.filename;

    const [result] = await db.query(
      `INSERT INTO resume_versions (user_id, name, version, cloudinary_url, cloudinary_public_id)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, name.trim(), version.trim(), cloudinaryUrl, cloudinaryPublicId]
    );

    const [resumes] = await db.query(
      `SELECT id, name, version, cloudinary_url, cloudinary_public_id, created_at,
              0 AS application_count, 0 AS interview_count, 0.0 AS success_rate
       FROM resume_versions WHERE id = ?`,
      [result.insertId]
    );

    // Log activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [req.user.id, `Uploaded resume: ${name} v${version}`, 'resume', result.insertId]
    );

    log('INFO', `Resume uploaded for user ${req.user.id}: ${name} v${version}`);

    return res.status(201).json({ success: true, message: 'Resume uploaded successfully.', data: resumes[0] });
  } catch (err) {
    log('ERROR', `UploadResume error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to upload resume.', data: null });
  }
};

// ─── DELETE /api/resumes/:id ──────────────────────────────────────────────────
const deleteResume = async (req, res) => {
  try {
    const resumeId = parseInt(req.params.id);

    // Verify ownership
    const [resumes] = await db.query(
      'SELECT id, cloudinary_public_id, name FROM resume_versions WHERE id = ? AND user_id = ?',
      [resumeId, req.user.id]
    );

    if (resumes.length === 0) {
      return res.status(404).json({ success: false, message: 'Resume not found.', data: null });
    }

    const resume = resumes[0];

    // Check if resume is used by any applications
    const [usedBy] = await db.query(
      'SELECT id FROM applications WHERE resume_version_id = ? AND user_id = ? LIMIT 1',
      [resumeId, req.user.id]
    );

    if (usedBy.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete this resume — it is linked to one or more applications. Remove it from applications first.',
        data: null,
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(resume.cloudinary_public_id, { resource_type: 'raw' });
      log('INFO', `Cloudinary file deleted: ${resume.cloudinary_public_id}`);
    } catch (cloudErr) {
      log('ERROR', `Cloudinary delete failed (continuing): ${cloudErr.message}`);
    }

    // Delete from DB
    await db.query('DELETE FROM resume_versions WHERE id = ? AND user_id = ?', [resumeId, req.user.id]);

    log('INFO', `Resume ${resumeId} deleted for user ${req.user.id}`);

    return res.json({ success: true, message: 'Resume deleted successfully.', data: null });
  } catch (err) {
    log('ERROR', `DeleteResume error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to delete resume.', data: null });
  }
};

module.exports = { getResumes, uploadResume, deleteResume };
