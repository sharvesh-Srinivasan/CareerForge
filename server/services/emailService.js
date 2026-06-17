const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const baseStyle = `
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8FAFC; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .header { background: #2563EB; padding: 32px 40px; text-align: center; }
    .header h1 { color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: #BFDBFE; margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px 40px; }
    .body h2 { color: #0F172A; font-size: 20px; font-weight: 600; margin: 0 0 12px; }
    .body p { color: #64748B; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .detail-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E2E8F0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748B; font-size: 13px; font-weight: 500; }
    .detail-value { color: #0F172A; font-size: 13px; font-weight: 600; }
    .btn { display: inline-block; background: #2563EB; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .footer { padding: 24px 40px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; }
    .footer p { color: #94A3B8; font-size: 12px; margin: 0; }
    .badge { display: inline-block; background: #EFF6FF; color: #2563EB; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .features { list-style: none; padding: 0; margin: 16px 0; }
    .features li { padding: 8px 0; color: #475569; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .features li::before { content: "✓"; color: #16A34A; font-weight: 700; }
  </style>
`;

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (to, name) => {
  const mailOptions = {
    from: `"CareerForge" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to CareerForge 🎯',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8">${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 CareerForge</h1>
            <p>Your placement tracking command center</p>
          </div>
          <div class="body">
            <h2>Welcome, ${name}! 👋</h2>
            <p>You're all set to supercharge your placement journey. CareerForge helps you stay organized, track every application, and never miss an important deadline.</p>
            <ul class="features">
              <li>Track all your job and internship applications in one place</li>
              <li>Store multiple resume versions with performance analytics</li>
              <li>Get email & WhatsApp reminders for OA and interview dates</li>
              <li>Visualize your placement funnel with rich analytics</li>
            </ul>
            <p>Start by adding your first application and uploading your resume.</p>
            <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Open CareerForge →</a>
          </div>
          <div class="footer">
            <p>CareerForge · Built for Indian college students · <a href="${process.env.CLIENT_URL}" style="color:#2563EB;">careerforge.vercel.app</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[INFO] [${new Date().toISOString()}] Welcome email sent to ${to}`);
  } catch (err) {
    console.error(`[ERROR] [${new Date().toISOString()}] Failed to send welcome email to ${to}:`, err.message);
  }
};

/**
 * Send reminder email
 */
const sendReminderEmail = async (to, name, reminder) => {
  const reminderDate = new Date(reminder.remind_at).toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const typeColors = {
    OA: '#D97706',
    Interview: '#7C3AED',
    'Referral Follow Up': '#0891B2',
    'Application Deadline': '#DC2626',
    'Resume Update': '#2563EB',
    Other: '#64748B',
  };

  const badgeColor = typeColors[reminder.reminder_type] || '#64748B';

  const mailOptions = {
    from: `"CareerForge" <${process.env.EMAIL_USER}>`,
    to,
    subject: `⏰ Reminder: ${reminder.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8">${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 CareerForge</h1>
            <p>You have a reminder coming up</p>
          </div>
          <div class="body">
            <h2>Hey ${name}, don't forget! ⏰</h2>
            <p>This is your CareerForge reminder for:</p>
            <div class="detail-card">
              <div class="detail-row">
                <span class="detail-label">Title</span>
                <span class="detail-value">${reminder.title}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type</span>
                <span class="detail-value" style="color:${badgeColor}">${reminder.reminder_type}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Scheduled For</span>
                <span class="detail-value">${reminderDate}</span>
              </div>
              ${reminder.company_name ? `
              <div class="detail-row">
                <span class="detail-label">Company</span>
                <span class="detail-value">${reminder.company_name}</span>
              </div>
              ` : ''}
            </div>
            <p>Make sure you're well-prepared. All the best! 🚀</p>
            <a href="${process.env.CLIENT_URL}/reminders" class="btn">View All Reminders →</a>
          </div>
          <div class="footer">
            <p>CareerForge · <a href="${process.env.CLIENT_URL}" style="color:#2563EB;">careerforge.vercel.app</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[INFO] [${new Date().toISOString()}] Reminder email sent to ${to}`);
  } catch (err) {
    console.error(`[ERROR] [${new Date().toISOString()}] Failed to send reminder email to ${to}:`, err.message);
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, token) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"CareerForge" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your CareerForge password 🔒',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8">${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 CareerForge</h1>
            <p>Password reset request</p>
          </div>
          <div class="body">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your CareerForge password. Click the button below to create a new password. This link expires in 1 hour.</p>
            <a href="${resetLink}" class="btn">Reset Password →</a>
            <p style="margin-top:24px; font-size:13px; color:#94A3B8;">If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
          </div>
          <div class="footer">
            <p>CareerForge · <a href="${process.env.CLIENT_URL}" style="color:#2563EB;">careerforge.vercel.app</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[INFO] [${new Date().toISOString()}] Password reset email sent to ${to}`);
  } catch (err) {
    console.error(`[ERROR] [${new Date().toISOString()}] Failed to send password reset email to ${to}:`, err.message);
  }
};

module.exports = { sendWelcomeEmail, sendReminderEmail, sendPasswordResetEmail };
