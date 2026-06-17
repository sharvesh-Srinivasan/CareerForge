require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('https');

const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const { startReminderJob } = require('./jobs/reminderJob');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      'https://career-forge-blond.vercel.app',
      'https://careerforge.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/reminders', reminderRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', data: null });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(`[ERROR] [${new Date().toISOString()}]`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[INFO] [${new Date().toISOString()}] CareerForge server running on port ${PORT}`);

  // Start cron jobs
  startReminderJob();

  // Keep-alive ping every 14 minutes to prevent Render cold starts
  setInterval(() => {
    const backendUrl = 'https://careerforge-backend.onrender.com/api/health';
    try {
      http.get(backendUrl, (res) => {
        console.log(`[INFO] [${new Date().toISOString()}] Keep-alive ping: ${res.statusCode}`);
      }).on('error', (err) => {
        console.log(`[INFO] [${new Date().toISOString()}] Keep-alive ping failed (expected in dev): ${err.message}`);
      });
    } catch (err) {
      // Silently ignore in dev
    }
  }, 14 * 60 * 1000);
});

module.exports = app;
