const db = require('../config/db');

const log = (level, msg) => console.log(`[${level}] [${new Date().toISOString()}] ${msg}`);

// ─── GET /api/interviews/:applicationId ───────────────────────────────────────
const getInterviewRounds = async (req, res) => {
  try {
    const appId = parseInt(req.params.applicationId);

    // Verify application belongs to user
    const [apps] = await db.query(
      'SELECT id FROM applications WHERE id = ? AND user_id = ?',
      [appId, req.user.id]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.', data: null });
    }

    const [rounds] = await db.query(
      'SELECT * FROM interview_rounds WHERE application_id = ? ORDER BY round_date ASC, created_at ASC',
      [appId]
    );

    return res.json({ success: true, message: 'Interview rounds fetched.', data: rounds });
  } catch (err) {
    log('ERROR', `GetInterviewRounds error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch interview rounds.', data: null });
  }
};

// ─── POST /api/interviews/:applicationId ──────────────────────────────────────
const addRound = async (req, res) => {
  try {
    const appId = parseInt(req.params.applicationId);

    // Verify application belongs to user
    const [apps] = await db.query(
      'SELECT id, company_name FROM applications WHERE id = ? AND user_id = ?',
      [appId, req.user.id]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.', data: null });
    }

    const { round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes } = req.body;

    if (!round_name) {
      return res.status(400).json({ success: false, message: 'Round name is required.', data: null });
    }

    const [result] = await db.query(
      `INSERT INTO interview_rounds
        (application_id, round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appId,
        round_name.trim(),
        round_date || null,
        questions_asked || null,
        topics_covered || null,
        difficulty || null,
        outcome || 'Pending',
        personal_notes || null,
      ]
    );

    const [rounds] = await db.query('SELECT * FROM interview_rounds WHERE id = ?', [result.insertId]);

    // Log activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [req.user.id, `Added ${round_name} for ${apps[0].company_name}`, 'interview_round', result.insertId]
    );

    log('INFO', `Interview round added for application ${appId}`);

    return res.status(201).json({ success: true, message: 'Interview round added.', data: rounds[0] });
  } catch (err) {
    log('ERROR', `AddRound error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to add interview round.', data: null });
  }
};

// ─── PATCH /api/interviews/round/:roundId ─────────────────────────────────────
const updateRound = async (req, res) => {
  try {
    const roundId = parseInt(req.params.roundId);

    // Verify round belongs to a user-owned application
    const [rounds] = await db.query(
      `SELECT ir.id FROM interview_rounds ir
       JOIN applications a ON a.id = ir.application_id
       WHERE ir.id = ? AND a.user_id = ?`,
      [roundId, req.user.id]
    );

    if (rounds.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview round not found.', data: null });
    }

    const { round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes } = req.body;

    await db.query(
      `UPDATE interview_rounds SET
        round_name = COALESCE(?, round_name),
        round_date = ?,
        questions_asked = ?,
        topics_covered = ?,
        difficulty = COALESCE(?, difficulty),
        outcome = COALESCE(?, outcome),
        personal_notes = ?
       WHERE id = ?`,
      [
        round_name || null,
        round_date !== undefined ? round_date : null,
        questions_asked !== undefined ? questions_asked : null,
        topics_covered !== undefined ? topics_covered : null,
        difficulty || null,
        outcome || null,
        personal_notes !== undefined ? personal_notes : null,
        roundId,
      ]
    );

    const [updated] = await db.query('SELECT * FROM interview_rounds WHERE id = ?', [roundId]);

    log('INFO', `Interview round ${roundId} updated`);

    return res.json({ success: true, message: 'Interview round updated.', data: updated[0] });
  } catch (err) {
    log('ERROR', `UpdateRound error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to update interview round.', data: null });
  }
};

// ─── DELETE /api/interviews/round/:roundId ────────────────────────────────────
const deleteRound = async (req, res) => {
  try {
    const roundId = parseInt(req.params.roundId);

    // Verify ownership
    const [rounds] = await db.query(
      `SELECT ir.id FROM interview_rounds ir
       JOIN applications a ON a.id = ir.application_id
       WHERE ir.id = ? AND a.user_id = ?`,
      [roundId, req.user.id]
    );

    if (rounds.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview round not found.', data: null });
    }

    await db.query('DELETE FROM interview_rounds WHERE id = ?', [roundId]);

    log('INFO', `Interview round ${roundId} deleted`);

    return res.json({ success: true, message: 'Interview round deleted.', data: null });
  } catch (err) {
    log('ERROR', `DeleteRound error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to delete interview round.', data: null });
  }
};

module.exports = { getInterviewRounds, addRound, updateRound, deleteRound };
