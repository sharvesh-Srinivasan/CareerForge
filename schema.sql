-- ============================================
-- CareerForge Database Schema
-- Run this against your MySQL/Aiven instance
-- ============================================

CREATE DATABASE IF NOT EXISTS careerforge;
USE careerforge;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT,
  auth_provider VARCHAR(50) DEFAULT 'local',
  google_id VARCHAR(255),
  phone VARCHAR(20),
  college VARCHAR(150),
  branch VARCHAR(100),
  graduation_year INT,
  whatsapp_subscribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('product','service','startup','consulting','other') DEFAULT 'other',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resume Versions
CREATE TABLE IF NOT EXISTS resume_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  package VARCHAR(50),
  application_date DATE NOT NULL,
  application_link TEXT,
  status ENUM(
    'Applied',
    'OA Scheduled',
    'OA Cleared',
    'Technical Round 1',
    'Technical Round 2',
    'Technical Round 3',
    'HR Round',
    'Offer Received',
    'Accepted',
    'Rejected',
    'Declined'
  ) DEFAULT 'Applied',
  resume_version_id INT,
  referral_name VARCHAR(100),
  referral_linkedin TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id) ON DELETE SET NULL
);

-- Interview Rounds
CREATE TABLE IF NOT EXISTS interview_rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  round_name VARCHAR(100) NOT NULL,
  round_date DATE,
  questions_asked TEXT,
  topics_covered TEXT,
  difficulty ENUM('Easy','Medium','Hard'),
  outcome ENUM('Cleared','Rejected','Pending') DEFAULT 'Pending',
  personal_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  application_id INT,
  title VARCHAR(200) NOT NULL,
  reminder_type ENUM(
    'OA',
    'Interview',
    'Referral Follow Up',
    'Application Deadline',
    'Resume Update',
    'Other'
  ) NOT NULL,
  remind_at DATETIME NOT NULL,
  send_email BOOLEAN DEFAULT TRUE,
  send_whatsapp BOOLEAN DEFAULT FALSE,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(200) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_interview_rounds_application_id ON interview_rounds(application_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON resume_versions(user_id);
