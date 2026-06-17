const twilio = require('twilio');

let client = null;

const getClient = () => {
  if (!client) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn(`[WARN] [${new Date().toISOString()}] Twilio credentials not configured. WhatsApp notifications disabled.`);
      return null;
    }
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

/**
 * Send WhatsApp reminder message via Twilio
 * @param {string} phone - User's phone number (digits only, without country code)
 * @param {object} reminder - Reminder object with title, reminder_type, remind_at
 */
const sendWhatsAppReminder = async (phone, reminder) => {
  const twilioClient = getClient();
  if (!twilioClient) return;

  if (!phone) {
    console.warn(`[WARN] [${new Date().toISOString()}] No phone number provided for WhatsApp reminder`);
    return;
  }

  const reminderDate = new Date(reminder.remind_at).toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  // Clean phone number — remove any non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  const toNumber = `whatsapp:+91${cleanPhone}`;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  const messageBody = `🎯 *CareerForge Reminder*

*${reminder.title}*

📌 Type: ${reminder.reminder_type}
📅 Scheduled: ${reminderDate}${reminder.company_name ? `\n🏢 Company: ${reminder.company_name}` : ''}

All the best! — CareerForge 🚀`;

  try {
    const message = await twilioClient.messages.create({
      body: messageBody,
      from: fromNumber,
      to: toNumber,
    });
    console.log(`[INFO] [${new Date().toISOString()}] WhatsApp reminder sent to ${toNumber}, SID: ${message.sid}`);
  } catch (err) {
    console.error(`[ERROR] [${new Date().toISOString()}] Failed to send WhatsApp reminder to ${toNumber}:`, err.message);
  }
};

module.exports = { sendWhatsAppReminder };
