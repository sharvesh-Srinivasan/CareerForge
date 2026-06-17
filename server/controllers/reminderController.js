const db = require('../config/db');

const log = (level, msg) => console.log(`[${level}] [${new Date().toISOString()}] ${msg}`);

const VALID_TYPES = ['OA', 'Interview', 'Referral Follow Up', 'Application Deadline', 'Resume Update', 'Other'];

// ─── GET /api/reminders ───────────────────────────────────────────────────────
const getReminders = async (req, res) => {
  try {
    const [reminders] = await db.query(
      `SELECT r.*, a.company_name
       FROM reminders r
       LEFT JOIN applications a ON a.id = r.application_id
       WHERE r.user_id = ?
       ORDER BY r.sent ASC, r.remind_at ASC`,
      [req.user.id]
    );

    return res.json({ success: true, message: 'Reminders fetched.', data: reminders });
  } catch (err) {
    log('ERROR', `GetReminders error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch reminders.', data: null });
  }
};

// ─── POST /api/reminders ──────────────────────────────────────────────────────
const createReminder = async (req, res) => {
  try {
    const { title, reminder_type, application_id, remind_at, send_email, send_whatsapp } = req.body;

    if (!title || !reminder_type || !remind_at) {
      return res.status(400).json({
        success: false,
        message: 'Title, type, and remind_at are required.',
        data: null,
      });
    }

    if (!VALID_TYPES.includes(reminder_type)) {
      return res.status(400).json({ success: false, message: 'Invalid reminder type.', data: null });
    }

    const [result] = await db.query(
      `INSERT INTO reminders (user_id, application_id, title, reminder_type, remind_at, send_email, send_whatsapp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        application_id || null,
        title.trim(),
        reminder_type,
        remind_at,
        send_email !== undefined ? (send_email ? 1 : 0) : 1,
        send_whatsapp ? 1 : 0,
      ]
    );

    const [reminders] = await db.query(
      `SELECT r.*, a.company_name FROM reminders r
       LEFT JOIN applications a ON a.id = r.application_id
       WHERE r.id = ?`,
      [result.insertId]
    );

    log('INFO', `Reminder created for user ${req.user.id}: ${title}`);

    return res.status(201).json({ success: true, message: 'Reminder created.', data: reminders[0] });
  } catch (err) {
    log('ERROR', `CreateReminder error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to create reminder.', data: null });
  }
};

// ─── PATCH /api/reminders/:id ─────────────────────────────────────────────────
const updateReminder = async (req, res) => {
  try {
    const reminderId = parseInt(req.params.id);

    const [existing] = await db.query(
      'SELECT id FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found.', data: null });
    }

    const { title, reminder_type, application_id, remind_at, send_email, send_whatsapp, sent } = req.body;

    await db.query(
      `UPDATE reminders SET
        title = COALESCE(?, title),
        reminder_type = COALESCE(?, reminder_type),
        application_id = ?,
        remind_at = COALESCE(?, remind_at),
        send_email = COALESCE(?, send_email),
        send_whatsapp = COALESCE(?, send_whatsapp),
        sent = COALESCE(?, sent)
       WHERE id = ? AND user_id = ?`,
      [
        title || null,
        reminder_type || null,
        application_id !== undefined ? application_id : null,
        remind_at || null,
        send_email !== undefined ? (send_email ? 1 : 0) : null,
        send_whatsapp !== undefined ? (send_whatsapp ? 1 : 0) : null,
        sent !== undefined ? (sent ? 1 : 0) : null,
        reminderId,
        req.user.id,
      ]
    );

    const [reminders] = await db.query(
      `SELECT r.*, a.company_name FROM reminders r
       LEFT JOIN applications a ON a.id = r.application_id
       WHERE r.id = ?`,
      [reminderId]
    );

    return res.json({ success: true, message: 'Reminder updated.', data: reminders[0] });
  } catch (err) {
    log('ERROR', `UpdateReminder error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to update reminder.', data: null });
  }
};

// ─── DELETE /api/reminders/:id ────────────────────────────────────────────────
const deleteReminder = async (req, res) => {
  try {
    const reminderId = parseInt(req.params.id);

    const [existing] = await db.query(
      'SELECT id FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found.', data: null });
    }

    await db.query('DELETE FROM reminders WHERE id = ? AND user_id = ?', [reminderId, req.user.id]);

    log('INFO', `Reminder ${reminderId} deleted for user ${req.user.id}`);

    return res.json({ success: true, message: 'Reminder deleted.', data: null });
  } catch (err) {
    log('ERROR', `DeleteReminder error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to delete reminder.', data: null });
  }
};

module.exports = { getReminders, createReminder, updateReminder, deleteReminder };
