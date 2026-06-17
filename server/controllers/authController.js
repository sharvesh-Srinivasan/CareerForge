const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const log = (level, msg) => console.log(`[${level}] [${new Date().toISOString()}] ${msg}`);

// ─── POST /api/auth/register ─────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, college, branch, graduation_year, phone, whatsapp_subscribed } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.', data: null });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.', data: null });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.', data: null });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.', data: null });
    }

    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.', data: null });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, college, branch, graduation_year, whatsapp_subscribed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        password_hash,
        phone || null,
        college || null,
        branch || null,
        graduation_year ? parseInt(graduation_year) : null,
        whatsapp_subscribed ? 1 : 0,
      ]
    );

    const userId = result.insertId;

    // Fetch inserted user
    const [users] = await db.query(
      'SELECT id, name, email, phone, college, branch, graduation_year, whatsapp_subscribed, created_at FROM users WHERE id = ?',
      [userId]
    );
    const user = users[0];

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(() => {});

    // Log activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [userId, `Welcome to CareerForge, ${user.name}!`, 'user', userId]
    );

    const token = generateToken(user);
    log('INFO', `New user registered: ${email}`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { token, user },
    });
  } catch (err) {
    log('ERROR', `Register error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.', data: null });
  }
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.', data: null });
    }

    // Find user
    const [users] = await db.query(
      'SELECT id, name, email, password_hash, phone, college, branch, graduation_year, whatsapp_subscribed, created_at FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', data: null });
    }

    const user = users[0];

    if (!user.password_hash) {
      return res.status(401).json({ success: false, message: 'Please login using Google.', data: null });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', data: null });
    }

    const { password_hash: _, ...safeUser } = user;
    const token = generateToken(safeUser);

    log('INFO', `User logged in: ${email}`);

    return res.json({
      success: true,
      message: 'Login successful.',
      data: { token, user: safeUser },
    });
  } catch (err) {
    log('ERROR', `Login error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.', data: null });
  }
};

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, college, branch, graduation_year, whatsapp_subscribed, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.', data: null });
    }

    return res.json({ success: true, message: 'User fetched.', data: users[0] });
  } catch (err) {
    log('ERROR', `GetMe error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch user.', data: null });
  }
};

// ─── PATCH /api/auth/profile ─────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, phone, college, branch, graduation_year, whatsapp_subscribed } = req.body;

    await db.query(
      `UPDATE users SET
        name = COALESCE(?, name),
        phone = ?,
        college = COALESCE(?, college),
        branch = COALESCE(?, branch),
        graduation_year = COALESCE(?, graduation_year),
        whatsapp_subscribed = ?
       WHERE id = ?`,
      [
        name || null,
        phone !== undefined ? phone : null,
        college || null,
        branch || null,
        graduation_year ? parseInt(graduation_year) : null,
        whatsapp_subscribed !== undefined ? (whatsapp_subscribed ? 1 : 0) : 0,
        req.user.id,
      ]
    );

    const [users] = await db.query(
      'SELECT id, name, email, phone, college, branch, graduation_year, whatsapp_subscribed, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    log('INFO', `Profile updated for user ${req.user.id}`);

    return res.json({ success: true, message: 'Profile updated successfully.', data: users[0] });
  } catch (err) {
    log('ERROR', `UpdateProfile error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to update profile.', data: null });
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.', data: null });
    }

    const [users] = await db.query('SELECT id, name, email FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.', data: null });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');

    // Send reset email (non-blocking)
    sendPasswordResetEmail(user.email, token).catch(() => {});

    log('INFO', `Password reset requested for: ${email}`);

    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.', data: null });
  } catch (err) {
    log('ERROR', `ForgotPassword error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to process request.', data: null });
  }
};

// ─── PATCH /api/auth/change-password ─────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.', data: null });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.', data: null });
    }

    const [users] = await db.query('SELECT id, password_hash FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.', data: null });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.', data: null });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    log('INFO', `Password changed for user ${req.user.id}`);

    return res.json({ success: true, message: 'Password changed successfully.', data: null });
  } catch (err) {
    log('ERROR', `ChangePassword error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to change password.', data: null });
  }
};

// ─── DELETE /api/auth/account ─────────────────────────────────────────────────
const deleteAccount = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    log('INFO', `Account deleted for user ${req.user.id}`);
    return res.json({ success: true, message: 'Account deleted successfully.', data: null });
  } catch (err) {
    log('ERROR', `DeleteAccount error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to delete account.', data: null });
  }
};

// ─── POST /api/auth/google ───────────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required.', data: null });
    }

    let payload;
    try {
      // Try verifying as an ID token (JWT)
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      // If it fails, assume it's an access token (from implicit flow) and fetch user info
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify token with Google');
      }
      payload = await response.json();
    }
    
    const { email, name, sub: google_id } = payload;

    // Check if user exists by email
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    let user;
    if (existing.length > 0) {
      user = existing[0];
      // Update google_id and auth_provider if missing
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = ?, auth_provider = ? WHERE id = ?', ['google', google_id, user.id]);
      }
    } else {
      // Create new user
      const [result] = await db.query(
        `INSERT INTO users (name, email, auth_provider, google_id) VALUES (?, ?, ?, ?)`,
        [name, email.toLowerCase().trim(), 'google', google_id]
      );
      
      const [newUsers] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
      
      // Attempt to send welcome email
      sendWelcomeEmail(user.email, user.name).catch((err) =>
        log('ERROR', `Welcome email failed for ${user.email}: ${err.message}`)
      );
    }

    // Generate token
    const jwtToken = generateToken(user);

    log('INFO', `Google Login successful: ${user.email}`);
    
    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });

  } catch (err) {
    log('ERROR', `Google login error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Google login failed.', data: null });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  changePassword,
  deleteAccount,
  googleLogin,
};
