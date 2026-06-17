const db = require('../config/db');

const log = (level, msg) => console.log(`[${level}] [${new Date().toISOString()}] ${msg}`);

const VALID_STATUSES = [
  'Applied', 'OA Scheduled', 'OA Cleared',
  'Technical Round 1', 'Technical Round 2', 'Technical Round 3',
  'HR Round', 'Offer Received', 'Accepted', 'Rejected', 'Declined',
];

// ─── GET /api/applications ────────────────────────────────────────────────────
const getApplications = async (req, res) => {
  try {
    const { status, search, sort = 'created_at', order = 'DESC' } = req.query;

    const allowedSorts = ['created_at', 'company_name', 'status', 'application_date'];
    const allowedOrders = ['ASC', 'DESC'];
    const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';
    const safeOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    let query = `
      SELECT a.*, rv.name AS resume_name, rv.version AS resume_version
      FROM applications a
      LEFT JOIN resume_versions rv ON rv.id = a.resume_version_id
      WHERE a.user_id = ?
    `;
    const params = [req.user.id];

    if (status && VALID_STATUSES.includes(status)) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (a.company_name LIKE ? OR a.role LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY a.${safeSort} ${safeOrder}`;

    const [applications] = await db.query(query, params);

    return res.json({ success: true, message: 'Applications fetched.', data: applications });
  } catch (err) {
    log('ERROR', `GetApplications error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications.', data: null });
  }
};

// ─── POST /api/applications ───────────────────────────────────────────────────
const createApplication = async (req, res) => {
  try {
    const {
      company_name, role, location, package: pkg, application_date, deadline,
      application_link, status, resume_version_id, referral_name,
      referral_linkedin, notes,
    } = req.body;

    if (!company_name || !role || !application_date) {
      return res.status(400).json({
        success: false,
        message: 'Company name, role, and application date are required.',
        data: null,
      });
    }

    const [result] = await db.query(
      `INSERT INTO applications
        (user_id, company_name, role, location, package, application_date, deadline,
         application_link, status, resume_version_id, referral_name,
         referral_linkedin, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        company_name.trim(),
        role.trim(),
        location || null,
        pkg || null,
        application_date,
        deadline || null,
        application_link || null,
        status || 'Applied',
        resume_version_id || null,
        referral_name || null,
        referral_linkedin || null,
        notes || null,
      ]
    );

    const [apps] = await db.query(
      `SELECT a.*, rv.name AS resume_name, rv.version AS resume_version
       FROM applications a
       LEFT JOIN resume_versions rv ON rv.id = a.resume_version_id
       WHERE a.id = ?`,
      [result.insertId]
    );

    // Log activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [req.user.id, `Added application to ${company_name}`, 'application', result.insertId]
    );

    // Auto-create reminder for the exact deadline
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const reminderDate = new Date(deadlineDate);

      if (reminderDate > new Date()) {
        await db.query(
          `INSERT INTO reminders 
           (user_id, application_id, title, reminder_type, remind_at, send_email, send_whatsapp) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            result.insertId,
            `Deadline: ${role.trim()} at ${company_name.trim()}`,
            'Application Deadline',
            reminderDate.toISOString(),
            1, // send_email
            req.user.whatsapp_subscribed ? 1 : 0 // send_whatsapp
          ]
        );
      }
    }

    log('INFO', `Application created for user ${req.user.id}: ${company_name}`);

    return res.status(201).json({ success: true, message: 'Application created.', data: apps[0] });
  } catch (err) {
    log('ERROR', `CreateApplication error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to create application.', data: null });
  }
};

// ─── GET /api/applications/stats ─────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Status counts
    const [statusRows] = await db.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'OA Scheduled' THEN 1 ELSE 0 END) AS oa_pending,
        SUM(CASE WHEN status IN ('Technical Round 1','Technical Round 2','Technical Round 3','HR Round') THEN 1 ELSE 0 END) AS interviews,
        SUM(CASE WHEN status IN ('Offer Received','Accepted') THEN 1 ELSE 0 END) AS offers,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN status = 'Applied' THEN 1 ELSE 0 END) AS applied
       FROM applications WHERE user_id = ?`,
      [userId]
    );

    // Applications per month (last 6 months)
    const [monthlyRows] = await db.query(
      `SELECT
        DATE_FORMAT(application_date, '%b %Y') AS month,
        DATE_FORMAT(application_date, '%Y-%m') AS month_key,
        COUNT(*) AS count
       FROM applications
       WHERE user_id = ? AND application_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month_key, month
       ORDER BY month_key ASC`,
      [userId]
    );

    // Status breakdown for funnel
    const [funnelRows] = await db.query(
      `SELECT status, COUNT(*) AS count FROM applications WHERE user_id = ? GROUP BY status`,
      [userId]
    );

    const funnelMap = {};
    funnelRows.forEach((r) => { funnelMap[r.status] = r.count; });

    const funnelStages = [
      { stage: 'Applied', count: (funnelMap['Applied'] || 0) + (funnelMap['OA Scheduled'] || 0) + (funnelMap['OA Cleared'] || 0) + (funnelMap['Technical Round 1'] || 0) + (funnelMap['Technical Round 2'] || 0) + (funnelMap['Technical Round 3'] || 0) + (funnelMap['HR Round'] || 0) + (funnelMap['Offer Received'] || 0) + (funnelMap['Accepted'] || 0) + (funnelMap['Rejected'] || 0) + (funnelMap['Declined'] || 0) },
      { stage: 'OA', count: (funnelMap['OA Scheduled'] || 0) + (funnelMap['OA Cleared'] || 0) + (funnelMap['Technical Round 1'] || 0) + (funnelMap['Technical Round 2'] || 0) + (funnelMap['Technical Round 3'] || 0) + (funnelMap['HR Round'] || 0) + (funnelMap['Offer Received'] || 0) + (funnelMap['Accepted'] || 0) },
      { stage: 'Technical', count: (funnelMap['Technical Round 1'] || 0) + (funnelMap['Technical Round 2'] || 0) + (funnelMap['Technical Round 3'] || 0) + (funnelMap['HR Round'] || 0) + (funnelMap['Offer Received'] || 0) + (funnelMap['Accepted'] || 0) },
      { stage: 'HR', count: (funnelMap['HR Round'] || 0) + (funnelMap['Offer Received'] || 0) + (funnelMap['Accepted'] || 0) },
      { stage: 'Offer', count: (funnelMap['Offer Received'] || 0) + (funnelMap['Accepted'] || 0) },
    ];

    // Conversion rates
    const total = statusRows[0].total || 0;
    const interviews = statusRows[0].interviews || 0;
    const offers = statusRows[0].offers || 0;
    const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
    const offerRate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;

    return res.json({
      success: true,
      message: 'Stats fetched.',
      data: {
        counts: statusRows[0],
        monthly: monthlyRows,
        funnel: funnelStages,
        statusBreakdown: funnelRows,
        interviewConversionRate: interviewRate,
        offerConversionRate: offerRate,
      },
    });
  } catch (err) {
    log('ERROR', `GetStats error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats.', data: null });
  }
};

// ─── GET /api/applications/:id ────────────────────────────────────────────────
const getApplication = async (req, res) => {
  try {
    const appId = parseInt(req.params.id);

    const [apps] = await db.query(
      `SELECT a.*, rv.name AS resume_name, rv.version AS resume_version, rv.cloudinary_url AS resume_url
       FROM applications a
       LEFT JOIN resume_versions rv ON rv.id = a.resume_version_id
       WHERE a.id = ? AND a.user_id = ?`,
      [appId, req.user.id]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.', data: null });
    }

    const [rounds] = await db.query(
      'SELECT * FROM interview_rounds WHERE application_id = ? ORDER BY round_date ASC, created_at ASC',
      [appId]
    );

    return res.json({
      success: true,
      message: 'Application fetched.',
      data: { ...apps[0], interview_rounds: rounds },
    });
  } catch (err) {
    log('ERROR', `GetApplication error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch application.', data: null });
  }
};

// ─── PATCH /api/applications/:id ──────────────────────────────────────────────
const updateApplication = async (req, res) => {
  try {
    const appId = parseInt(req.params.id);

    // Verify ownership
    const [existing] = await db.query(
      'SELECT id, company_name, status FROM applications WHERE id = ? AND user_id = ?',
      [appId, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.', data: null });
    }

    const {
      company_name, role, location, package: pkg, application_date, deadline,
      application_link, status, resume_version_id, referral_name,
      referral_linkedin, notes,
    } = req.body;

    await db.query(
      `UPDATE applications SET
        company_name = COALESCE(?, company_name),
        role = COALESCE(?, role),
        location = ?,
        package = ?,
        application_date = COALESCE(?, application_date),
        deadline = ?,
        application_link = ?,
        status = COALESCE(?, status),
        resume_version_id = ?,
        referral_name = ?,
        referral_linkedin = ?,
        notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        company_name || null,
        role || null,
        location !== undefined ? location : null,
        pkg !== undefined ? pkg : null,
        application_date || null,
        deadline !== undefined ? deadline : null,
        application_link !== undefined ? application_link : null,
        status || null,
        resume_version_id !== undefined ? resume_version_id : null,
        referral_name !== undefined ? referral_name : null,
        referral_linkedin !== undefined ? referral_linkedin : null,
        notes !== undefined ? notes : null,
        appId,
        req.user.id,
      ]
    );

    const [apps] = await db.query(
      `SELECT a.*, rv.name AS resume_name, rv.version AS resume_version
       FROM applications a
       LEFT JOIN resume_versions rv ON rv.id = a.resume_version_id
       WHERE a.id = ?`,
      [appId]
    );

    // Log activity if status changed
    if (status && status !== existing[0].status) {
      await db.query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
        [req.user.id, `Updated ${existing[0].company_name} status to ${status}`, 'application', appId]
      );
    }

    log('INFO', `Application ${appId} updated for user ${req.user.id}`);

    return res.json({ success: true, message: 'Application updated.', data: apps[0] });
  } catch (err) {
    log('ERROR', `UpdateApplication error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to update application.', data: null });
  }
};

// ─── DELETE /api/applications/:id ─────────────────────────────────────────────
const deleteApplication = async (req, res) => {
  try {
    const appId = parseInt(req.params.id);

    const [existing] = await db.query(
      'SELECT id, company_name FROM applications WHERE id = ? AND user_id = ?',
      [appId, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.', data: null });
    }

    await db.query('DELETE FROM applications WHERE id = ? AND user_id = ?', [appId, req.user.id]);

    await db.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [req.user.id, `Deleted application at ${existing[0].company_name}`, 'application', appId]
    );

    log('INFO', `Application ${appId} deleted for user ${req.user.id}`);

    return res.json({ success: true, message: 'Application deleted.', data: null });
  } catch (err) {
    log('ERROR', `DeleteApplication error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to delete application.', data: null });
  }
};

// ─── GET /api/applications/activity ──────────────────────────────────────────
const getActivity = async (req, res) => {
  try {
    const [logs] = await db.query(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    return res.json({ success: true, message: 'Activity fetched.', data: logs });
  } catch (err) {
    log('ERROR', `GetActivity error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch activity.', data: null });
  }
};

module.exports = {
  getApplications,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
  getStats,
  getActivity,
};
