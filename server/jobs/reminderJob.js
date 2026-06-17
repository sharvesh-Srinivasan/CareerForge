const cron = require('node-cron');
const db = require('../config/db');
const { sendReminderEmail } = require('../services/emailService');
const { sendWhatsAppReminder } = require('../services/whatsappService');

const log = (level, msg) => console.log(`[${level}] [${new Date().toISOString()}] ${msg}`);

const processReminders = async () => {
  try {
    // Fetch due reminders (within a 10-minute window to handle slight delays)
    const [reminders] = await db.query(
      `SELECT r.*, a.company_name
       FROM reminders r
       LEFT JOIN applications a ON a.id = r.application_id
       WHERE r.sent = FALSE
         AND r.remind_at <= NOW()
         AND r.remind_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
      []
    );

    if (reminders.length === 0) return;

    log('INFO', `Processing ${reminders.length} due reminder(s)`);

    for (const reminder of reminders) {
      // Fetch user details
      const [users] = await db.query(
        'SELECT id, name, email, phone, whatsapp_subscribed FROM users WHERE id = ?',
        [reminder.user_id]
      );

      if (users.length === 0) continue;

      const user = users[0];

      // Send email
      if (reminder.send_email) {
        await sendReminderEmail(user.email, user.name, reminder);
      }

      // Send WhatsApp
      if (
        reminder.send_whatsapp &&
        user.whatsapp_subscribed &&
        user.phone
      ) {
        await sendWhatsAppReminder(user.phone, reminder);
      }

      // Mark as sent
      await db.query('UPDATE reminders SET sent = TRUE WHERE id = ?', [reminder.id]);

      // Log activity
      await db.query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
        [reminder.user_id, `Reminder sent: ${reminder.title}`, 'reminder', reminder.id]
      );

      log('INFO', `Reminder ${reminder.id} processed for user ${reminder.user_id}`);
    }
  } catch (err) {
    log('ERROR', `ReminderJob error: ${err.message}`);
  }
};

const startReminderJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', processReminders, {
    timezone: 'Asia/Kolkata',
  });

  log('INFO', 'Reminder cron job started (every 5 minutes, IST)');
};

module.exports = { startReminderJob, processReminders };
